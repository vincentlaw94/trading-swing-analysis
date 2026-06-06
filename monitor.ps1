# BTC Swing Trading Monitor
# Runs Claude Code analysis at configurable intervals

param(
    [int]$IntervalMinutes = 60,       # Default: check every hour
    [string]$Timeframe = "4H",        # Default timeframe
    [switch]$QuickMode,               # Use minimal token analysis
    [int]$MaxCycles = 0               # 0 = infinite
)

$ProjectPath = "C:\Users\vince\btc-swing-analysis"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path "$ProjectPath\monitor.log" -Value $logMessage
}

function Get-AnalysisPrompt {
    param([bool]$Quick)

    if ($Quick) {
        return @"
Quick BTC check - minimal tokens:
1. tv_health_check
2. quote_get for current price
3. chart_get_state for timeframe/indicators
4. Report: Price, trend direction, nearest FVG/ERL if visible
Keep response under 200 words.
"@
    } else {
        return @"
BTC Swing Analysis for $Timeframe timeframe:
1. Check connection with tv_health_check
2. Get chart state with chart_get_state
3. Get price data with data_get_ohlcv --summary
4. Get indicator values with data_get_study_values
5. Check for FVG zones with data_get_pine_lines
6. Provide analysis in the format from CLAUDE.md
Focus on FVG entries and ERL exit targets.
"@
    }
}

Write-Log "Starting BTC Swing Trading Monitor"
Write-Log "Interval: $IntervalMinutes minutes | Timeframe: $Timeframe | Quick Mode: $QuickMode"

$cycle = 0
while ($true) {
    $cycle++

    if ($MaxCycles -gt 0 -and $cycle -gt $MaxCycles) {
        Write-Log "Reached max cycles ($MaxCycles). Exiting."
        break
    }

    Write-Log "=== Analysis Cycle $cycle ==="

    $prompt = Get-AnalysisPrompt -Quick $QuickMode

    # Run Claude Code with the analysis prompt
    # The --print flag outputs result without interactive mode
    try {
        Write-Log "Running analysis..."
        $result = claude --print "$prompt" --cwd "$ProjectPath" 2>&1

        # Save result to file
        $resultFile = "$ProjectPath\results\analysis_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
        New-Item -Path "$ProjectPath\results" -ItemType Directory -Force | Out-Null
        $result | Out-File -FilePath $resultFile -Encoding UTF8

        Write-Log "Analysis saved to: $resultFile"

        # Check for alerts in the result
        if ($result -match "ALERT|SIGNAL.*LONG|SIGNAL.*SHORT") {
            Write-Log "*** POTENTIAL SIGNAL DETECTED - Check results ***"

            # Windows notification
            [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
            $template = [Windows.UI.Notifications.ToastTemplateType]::ToastText02
            $xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent($template)
            $xml.GetElementsByTagName("text")[0].AppendChild($xml.CreateTextNode("BTC Alert")) > $null
            $xml.GetElementsByTagName("text")[1].AppendChild($xml.CreateTextNode("Potential trading signal detected!")) > $null
            [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("BTC Monitor").Show(
                [Windows.UI.Notifications.ToastNotification]::new($xml)
            )
        }
    }
    catch {
        Write-Log "Error during analysis: $_"
    }

    # Sleep until next check
    Write-Log "Sleeping for $IntervalMinutes minutes..."
    Start-Sleep -Seconds ($IntervalMinutes * 60)
}

Write-Log "Monitor stopped."
