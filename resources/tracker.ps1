Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
# Force console to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

while ($true) {
    try {
        $focused = [System.Windows.Automation.AutomationElement]::FocusedElement
        if ($focused) {
            # Get ControlType
            $controlType = $focused.Current.ControlType.Id
            
            # Allow common text-editable control types
            $allowedTypes = @(50004, 50030, 50033, 50020, 50032, 50026, 50025)
            if ($controlType -notin $allowedTypes) {
                # Not a text-editable element, skip
                Start-Sleep -Milliseconds 100
                continue
            }

            # Try to get TextPattern
            $pattern = $null
            try {
                $pattern = $focused.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern)
            }
            catch {}

            if ($pattern) {
                # TextPattern available - works for most apps
                $ranges = $pattern.GetSelection()
                if ($ranges.Count -gt 0) {
                    $rects = $ranges[0].GetBoundingRectangles()
                    if ($rects.Length -gt 0) {
                        $rect = $rects[0]
                        
                        # Get the text from the document
                        $text = ""
                        try {
                            $text = $pattern.DocumentRange.GetText(-1)
                        }
                        catch {}

                        # Output JSON with coordinates and text
                        $output = @{
                            x           = $rect.X
                            y           = $rect.Y
                            height      = $rect.Height
                            text        = $text
                            hasFocus    = $true
                            processName = ""
                            processId   = $focused.Current.ProcessId
                            runtimeId   = $focused.GetRuntimeId() -join ","
                        }

                        # Try to get process name
                        try {
                            $proc = Get-Process -Id $focused.Current.ProcessId
                            $output["processName"] = $proc.ProcessName
                            
                            # IGNORE SELF (Electron)
                            if ($proc.ProcessName -eq "electron" -or $proc.ProcessName -eq "Promptly") {
                                continue
                            }
                        }
                        catch {}

                        $json = $output | ConvertTo-Json -Compress
                        Write-Output $json
                    }
                }
            }
            else {
                # TextPattern not available - fallback for Electron apps
                # For ChatGPT/Claude desktop, position widget at window center
                try {
                    $rect = $focused.Current.BoundingRectangle
                    
                    # Skip if bounding rect is invalid (negative coords or too large)
                    if ($rect.X -lt 0 -or $rect.Y -lt 0 -or $rect.Height -gt 2000) {
                        Start-Sleep -Milliseconds 100
                        continue
                    }
                    
                    # Get text using ValuePattern if available
                    $text = ""
                    try {
                        $valuePattern = $focused.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
                        if ($valuePattern) {
                            $text = $valuePattern.Current.Value
                        }
                    }
                    catch {}

                    # Calculate center position for large elements
                    $outputX = $rect.X
                    $outputY = $rect.Y
                    
                    # If element is very large (likely whole window), use center
                    if ($rect.Width -gt 800 -or $rect.Height -gt 600) {
                        $outputX = $rect.X + ($rect.Width / 2) - 100
                        $outputY = $rect.Y + ($rect.Height / 2)
                    }

                    $output = @{
                        x           = $outputX
                        y           = $outputY
                        height      = [Math]::Min($rect.Height, 60)
                        text        = $text
                        hasFocus    = $true
                        processName = ""
                        processId   = $focused.Current.ProcessId
                        runtimeId   = $focused.GetRuntimeId() -join ","
                    }

                    # Try to get process name
                    try {
                        $proc = Get-Process -Id $focused.Current.ProcessId
                        $output["processName"] = $proc.ProcessName
                        
                        # IGNORE SELF (Electron)
                        if ($proc.ProcessName -eq "electron" -or $proc.ProcessName -eq "Promptly") {
                            continue
                        }
                    }
                    catch {}

                    $json = $output | ConvertTo-Json -Compress
                    Write-Output $json
                }
                catch {}
            }
        }
    }
    catch {
        # Ignore errors silently to keep the stream clean
    }
    Start-Sleep -Milliseconds 100
}
