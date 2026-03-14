Param(
  [Parameter(Mandatory=$true)] [string] $AccessToken,
  [Parameter(Mandatory=$true)] [string] $Urn,
  [Parameter(Mandatory=$true)] [string] $ImagePath,
  [string] $PostText = ""
)

if (-not $PostText) {
  $PostText = @"
🔐 AI + Cybersecurity: Trust should be a primary design goal, not a checkbox

In 2026, the biggest risk isn’t that AI will “take over” — it’s that we’ll deploy powerful models without treating them like software that attackers already know how to exploit.

Here’s what I’m seeing in the field:
- **Data drift + poisoning** are already being weaponized against models in production.
- **Model extraction & prompt injection** are the new “SQL injection” for LLMs.
- Yet most teams still treat ML security as “post-launch monitoring” instead of “secure-by-design.”

If we want AI we can rely on, we must:
1. Build threat models for every model (yes, even the “nice-to-have” ones).
2. Treat training pipelines as attack surface (code + data = risk).
3. Make explainability and audit trails standard, not optional.

When we do, we get systems that not only perform well — they also stay safe, compliant, and resilient under adversarial pressure.

Curious what you think: **What’s the biggest “AI security” gap your team is trying to close today?**

#AI #Cybersecurity #MLSecurity #Infosec #SecureAI
"@
} elseif (Test-Path $PostText) {
  $PostText = Get-Content -Raw -Path $PostText
}

# 1) Register upload
$registerBody = @{ 
  registerUploadRequest = @{ 
    recipes = @("urn:li:digitalmediaRecipe:feedshare-image")
    owner = $Urn
    serviceRelationships = @(
      @{ relationshipType = "OWNER"; identifier = "urn:li:userGeneratedContent" }
    )
  }
} | ConvertTo-Json -Depth 10

$registerResponse = Invoke-RestMethod -Uri "https://api.linkedin.com/v2/assets?action=registerUpload" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $AccessToken"; "Content-Type" = "application/json" } `
  -Body $registerBody

$uploadUrl = $registerResponse.value.uploadMechanism.'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'.uploadUrl
$assetUrn = $registerResponse.value.asset

if (-not $uploadUrl -or -not $assetUrn) {
  Write-Error "Failed to register upload. Response: $($registerResponse | ConvertTo-Json -Depth 5)"
  exit 1
}

# 2) Upload image bytes
Invoke-RestMethod -Uri $uploadUrl `
  -Method Put `
  -Headers @{ "Content-Type" = "application/octet-stream" } `
  -InFile $ImagePath

# 3) Post the UGC with image attached
$postBody = @{ 
  author = $Urn
  lifecycleState = "PUBLISHED"
  specificContent = @{ 
    'com.linkedin.ugc.ShareContent' = @{ 
      shareCommentary = @{ 
        text = $PostText
      }
      shareMediaCategory = "IMAGE"
      media = @(
        @{ 
          status = "READY"
          description = @{ text = "A stylized lock overlaid on a digital circuit board, representing secure AI systems." }
          media = $assetUrn
          title = @{ text = "Secure AI systems" }
        }
      )
    }
  }
  visibility = @{ 'com.linkedin.ugc.MemberNetworkVisibility' = 'PUBLIC' }
} | ConvertTo-Json -Depth 12

Invoke-RestMethod -Uri "https://api.linkedin.com/v2/ugcPosts" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $AccessToken"; "Content-Type" = "application/json"; "X-Restli-Protocol-Version" = "2.0.0" } `
  -Body $postBody
