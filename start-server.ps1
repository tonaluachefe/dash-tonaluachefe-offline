# Simple HTTP Server Starter
$rootPath = Get-Location
Write-Host "Starting HTTP Server on http://localhost:5500"
Write-Host "Root path: $rootPath"

$httpListener = New-Object System.Net.HttpListener
$httpListener.Prefixes.Add("http://localhost:5500/")
$httpListener.Start()
Write-Host "Server started. Press Ctrl+C to stop."

while ($true) {
    try {
        $context = $httpListener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" }
        
        $filePath = Join-Path $rootPath $path.TrimStart("/")
        
        if (Test-Path $filePath) {
            $fileContent = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $fileContent.Length
            
            if ($filePath.EndsWith(".html")) { $response.ContentType = "text/html" }
            elseif ($filePath.EndsWith(".css")) { $response.ContentType = "text/css" }
            elseif ($filePath.EndsWith(".js")) { $response.ContentType = "application/javascript" }
            else { $response.ContentType = "application/octet-stream" }
            
            $response.OutputStream.Write($fileContent, 0, $fileContent.Length)
        } else {
            $response.StatusCode = 404
            $response.StatusDescription = "Not Found"
        }
        
        $response.Close()
    } catch {
        Write-Host "Error: $_"
    }
}
