param(
	[string]$BaseUrl = "http://localhost:8000/api/v1",
	[string]$Password = "Passw0rd!23"
)

$ErrorActionPreference = 'Stop'

Write-Host "[smoke] BaseUrl: $BaseUrl"

$health = Invoke-RestMethod -Uri "http://localhost:8000/ready" -Method Get -TimeoutSec 20
if ($health.status -ne 'ready') {
	throw "Backend is not ready: $($health | ConvertTo-Json -Depth 4)"
}

$rand = Get-Random -Minimum 10000 -Maximum 99999
$email = "smoke$rand@example.com"
$username = "smoke$rand"

$signupBody = @{ username = $username; email = $email; password = $Password; full_name = "Smoke Tester" } | ConvertTo-Json
$signup = Invoke-RestMethod -Uri "$BaseUrl/signup" -Method Post -ContentType 'application/json' -Body $signupBody
if (-not $signup.access_token) { throw "Signup did not return access_token" }

$loginBody = @{ email = $email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$BaseUrl/login" -Method Post -ContentType 'application/json' -Body $loginBody
$token = $login.access_token
if (-not $token) { throw "Login did not return access_token" }

$headers = @{ Authorization = "Bearer $token" }

$anBody = @{ text = "I am feeling stressed today but I am trying to recover." } | ConvertTo-Json
$an = Invoke-RestMethod -Uri "$BaseUrl/analyze-live" -Method Post -Headers $headers -ContentType 'application/json' -Body $anBody

$sjBody = @{ title = "Smoke Test"; content = "This is a smoke test journal entry."; tags = @("smoke","test") } | ConvertTo-Json
$sj = Invoke-RestMethod -Uri "$BaseUrl/save-journal" -Method Post -Headers $headers -ContentType 'application/json' -Body $sjBody

$frame = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/'
$vsBody = @{ frame = $frame } | ConvertTo-Json
$vs = Invoke-RestMethod -Uri "$BaseUrl/analyze-vision-live" -Method Post -Headers $headers -ContentType 'application/json' -Body $vsBody

$flBody = @{ timestamp = (Get-Date).ToUniversalTime().ToString('o'); predicted_emotion = $vs.predicted_emotion; confidence_score = $vs.confidence_score; recommended_action_taken = 'taken' } | ConvertTo-Json
$fl = Invoke-RestMethod -Uri "$BaseUrl/facial-emotion-logs" -Method Post -Headers $headers -ContentType 'application/json' -Body $flBody

$logs = Invoke-RestMethod -Uri "$BaseUrl/facial-emotion-logs?limit=5" -Method Get -Headers $headers

$sosBody = @{ user_id = $signup.user_id; user_name = 'Smoke Tester'; contacts = @(@{ name = 'Emergency'; email = 'help@example.com'; relationship = 'emergency_contact' }); message = 'smoke test'; wellness_index = 12; emotion = 'fear' } | ConvertTo-Json -Depth 5
$sos = Invoke-RestMethod -Uri "$BaseUrl/trigger-sos" -Method Post -Headers $headers -ContentType 'application/json' -Body $sosBody

$dash = Invoke-RestMethod -Uri "$BaseUrl/dashboard-analytics?limit=30" -Method Get -Headers $headers

Write-Host "[ok] signup/login user=$username"
Write-Host "[ok] analyze-live emotion=$($an.emotion) wellness=$($an.wellness_index)"
Write-Host "[ok] save-journal id=$($sj.journal_id)"
Write-Host "[ok] vision emotion=$($vs.predicted_emotion) distress=$($vs.distress_level)"
Write-Host "[ok] facial-log id=$($fl.id) logs=$($logs.logs.Count)"
Write-Host "[ok] sos contacts_notified=$($sos.contacts_notified)"
Write-Host "[ok] dashboard entries=$($dash.total_entries) dominant=$($dash.dominant_emotion)"
