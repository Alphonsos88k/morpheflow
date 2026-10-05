import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { PickPathRequest } from "@morpheflow/spec";
import { AppError } from "../lib/errors.ts";
import { fromRoot } from "../lib/paths.ts";

const run = promisify(execFile);

/** Give up if the dialog is left open this long. */
const DIALOG_TIMEOUT_MS = 10 * 60_000;

/**
 * C# for the modern Explorer-style folder picker (IFileOpenDialog in "pick folders" mode).
 * PowerShell 5.1's FolderBrowserDialog is the old tree-view box; this matches the file dialogs.
 * Interfaces declare only the COM methods up to the last one we call (vtable order matters).
 */
const FOLDER_PICKER_CS = `
using System;
using System.Runtime.InteropServices;
public static class MfFolderPicker {
  [ComImport, Guid("DC1C5A9C-E88A-4dde-A5A1-60F82A20AEF7")] class FileOpenDialogCoClass {}
  [ComImport, Guid("42f85136-db7e-439c-85f1-e4075d135fc8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IFileDialog {
    [PreserveSig] int Show(IntPtr owner);
    void SetFileTypes(uint count, IntPtr specs); void SetFileTypeIndex(uint i); void GetFileTypeIndex(out uint i);
    void Advise(IntPtr events, out uint cookie); void Unadvise(uint cookie);
    void SetOptions(uint options); void GetOptions(out uint options);
    void SetDefaultFolder(IShellItem item); void SetFolder(IShellItem item);
    void GetFolder(out IShellItem item); void GetCurrentSelection(out IShellItem item);
    void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string name); void GetFileName(out IntPtr name);
    void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string title);
    void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string text); void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string text);
    void GetResult(out IShellItem item);
  }
  [ComImport, Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IShellItem {
    void BindToHandler(IntPtr bc, ref Guid bhid, ref Guid riid, out IntPtr ppv); void GetParent(out IShellItem parent);
    void GetDisplayName(uint sigdn, [MarshalAs(UnmanagedType.LPWStr)] out string name);
  }
  [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
  static extern void SHCreateItemFromParsingName(string path, IntPtr bc, ref Guid riid, out IShellItem item);

  const uint FOS_PICKFOLDERS = 0x20, FOS_FORCEFILESYSTEM = 0x40;
  const uint SIGDN_FILESYSPATH = 0x80058000;

  public static string Pick(string title, string initial, IntPtr owner) {
    var dialog = (IFileDialog)new FileOpenDialogCoClass();
    dialog.SetOptions(FOS_PICKFOLDERS | FOS_FORCEFILESYSTEM);
    if (!String.IsNullOrEmpty(title)) dialog.SetTitle(title);
    if (!String.IsNullOrEmpty(initial) && System.IO.Directory.Exists(initial)) {
      var iid = typeof(IShellItem).GUID; IShellItem start;
      SHCreateItemFromParsingName(initial, IntPtr.Zero, ref iid, out start);
      dialog.SetFolder(start);
    }
    if (dialog.Show(owner) != 0) return null;
    IShellItem result; string path;
    dialog.GetResult(out result);
    result.GetDisplayName(SIGDN_FILESYSPATH, out path);
    return path;
  }
}
`;

/**
 * PowerShell that shows a native Open-file, Save-as, or folder dialog (all Explorer-style) on top of other windows.
 * Inputs come from environment variables, so paths/filters are never pasted into the script.
 */
const DIALOG_SCRIPT = `
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true; ShowInTaskbar = $false }
$init = $env:MF_INITIAL
if ($env:MF_KIND -eq 'folder') {
  Add-Type -TypeDefinition $env:MF_FOLDER_CS
  $picked = [MfFolderPicker]::Pick($env:MF_TITLE, $init, $owner.Handle)
  if ($picked) { [Console]::Out.Write($picked) }
} else {
  $d = if ($env:MF_KIND -eq 'save') { New-Object System.Windows.Forms.SaveFileDialog } else { New-Object System.Windows.Forms.OpenFileDialog }
  $d.Title = $env:MF_TITLE
  $d.Filter = $env:MF_FILTER
  if ($init) {
    $dir = if (Test-Path -LiteralPath $init -PathType Container) { $init } else { Split-Path -Parent $init }
    if ($dir -and (Test-Path -LiteralPath $dir)) { $d.InitialDirectory = $dir }
    if ($env:MF_KIND -eq 'save' -and -not (Test-Path -LiteralPath $init -PathType Container)) { $d.FileName = Split-Path -Leaf $init }
  }
  if ($d.ShowDialog($owner) -eq 'OK') { [Console]::Out.Write($d.FileName) }
}
$owner.Dispose()
`;

/**
 * Opens a native Windows file/folder picker on this PC and waits for the user.
 * @param request - File or folder, title, filter, and starting location.
 * @returns The chosen absolute path, or null if cancelled.
 */
export async function pickPath(request: PickPathRequest): Promise<string | null> {
  if (process.platform !== "win32")
    throw new AppError("Browse is only available on Windows; type the path instead.");
  // Relative start folders (e.g. the patterns folder) are relative to the project root.
  const unquoted = request.initialPath.replace(/^"(.*)"$/, "$1");
  const initialPath = unquoted && !path.isAbsolute(unquoted) ? fromRoot(unquoted) : unquoted;
  const { stdout } = await run(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-STA",
      "-EncodedCommand",
      Buffer.from(DIALOG_SCRIPT, "utf16le").toString("base64"),
    ],
    {
      timeout: DIALOG_TIMEOUT_MS,
      windowsHide: true,
      env: {
        ...process.env,
        MF_KIND: request.kind,
        MF_TITLE: request.title,
        MF_FILTER: request.filter,
        MF_INITIAL: initialPath,
        MF_FOLDER_CS: FOLDER_PICKER_CS,
      },
    },
  );
  return stdout.trim() || null;
}
