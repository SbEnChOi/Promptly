param (
    [int]$ProcessId,
    [string]$Text
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName Microsoft.VisualBasic

try {
    # 1. Focus the target process
    $proc = Get-Process -Id $ProcessId -ErrorAction Stop
    $hwnd = $proc.MainWindowHandle
    
    if ($hwnd -ne [IntPtr]::Zero) {
        # Bring window to front
        [Microsoft.VisualBasic.Interaction]::AppActivate($ProcessId)
        Start-Sleep -Milliseconds 300
    }
    else {
        Write-Error "No valid window handle found for process ID $ProcessId"
        exit 1
    }

    # 2. Send Keys (Ctrl+A, Delete, Paste)
    # We use Clipboard for reliability with large text
    [System.Windows.Forms.Clipboard]::SetText($Text)
    
    # Ctrl+A
    [System.Windows.Forms.SendKeys]::SendWait("^a")
    Start-Sleep -Milliseconds 50
    
    # Delete (optional, but safer to clear)
    [System.Windows.Forms.SendKeys]::SendWait("{DELETE}")
    Start-Sleep -Milliseconds 50

    # Paste (Ctrl+V)
    [System.Windows.Forms.SendKeys]::SendWait("^v")
    
    Write-Output "Success"
}
catch {
    Write-Error $_.Exception.Message
}
