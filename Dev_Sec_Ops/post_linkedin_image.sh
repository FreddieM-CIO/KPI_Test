#!/usr/bin/env bash
# Usage: ./post_linkedin_image.sh <ACCESS_TOKEN> <URN> <IMAGE_PATH> [POST_TEXT_OR_FILE]
# Requires: curl, jq

set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <ACCESS_TOKEN> <URN> <IMAGE_PATH> [POST_TEXT_OR_FILE]" >&2
  echo "  POST_TEXT_OR_FILE: optional text to post, or a file path containing the post body." >&2
  exit 1
fi

ACCESS_TOKEN="$1"
URN="$2"
IMAGE_PATH="$3"
POST_TEXT=""

if [[ $# -ge 4 ]]; then
  if [[ -f "$4" ]]; then
    POST_TEXT=$(<"$4")
  else
    POST_TEXT="$4"
  fi
fi

if [[ -z "$POST_TEXT" ]]; then
  POST_TEXT="🔐 AI + Cybersecurity: Trust should be a primary design goal, not a checkbox\n\nIn 2026, the biggest risk isn’t that AI will “take over” — it’s that we’ll deploy powerful models without treating them like software that attackers already know how to exploit.\n\nHere’s what I’m seeing in the field:\n- **Data drift + poisoning** are already being weaponized against models in production.\n- **Model extraction & prompt injection** are the new “SQL injection” for LLMs.\n- Yet most teams still treat ML security as “post-launch monitoring” instead of “secure-by-design.”\n\nIf we want AI we can rely on, we must:\n1. Build threat models for every model (yes, even the “nice-to-have” ones).\n2. Treat training pipelines as attack surface (code + data = risk).\n3. Make explainability and audit trails standard, not optional.\n\nWhen we do, we get systems that not only perform well — they also stay safe, compliant, and resilient under adversarial pressure.\n\nCurious what you think: **What’s the biggest “AI security” gap your team is trying to close today?**\n\n#AI #Cybersecurity #MLSecurity #Infosec #SecureAI"
fi

# 1) Register upload
register_response=$(curl -s -X POST "https://api.linkedin.com/v2/assets?action=registerUpload" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\
    \"registerUploadRequest\": {\
      \"recipes\": [\"urn:li:digitalmediaRecipe:feedshare-image\"],\
      \"owner\": \"${URN}\",\
      \"serviceRelationships\": [\
        {\
          \"relationshipType\": \"OWNER\",\
          \"identifier\": \"urn:li:userGeneratedContent\"\
        }\
      ]\
    }\
  }"
)

UPLOAD_URL=$(echo "$register_response" | jq -r '.value.uploadMechanism."com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest".uploadUrl')
ASSET_URN=$(echo "$register_response" | jq -r '.value.asset')

if [[ -z "$UPLOAD_URL" || -z "$ASSET_URN" ]]; then
  echo "ERROR: Failed to register upload. Response: $register_response" >&2
  exit 1
fi

# 2) Upload image bytes
curl -s -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@$IMAGE_PATH"

# 3) Post the UGC with image attached
POST_BODY=$(jq -n --arg author "$URN" --arg text "$POST_TEXT" --arg asset "$ASSET_URN" '{
  author: $author,
  lifecycleState: "PUBLISHED",
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: { text: $text },
      shareMediaCategory: "IMAGE",
      media: [
        {
          status: "READY",
          description: { text: "A stylized lock overlaid on a digital circuit board, representing secure AI systems." },
          media: $asset,
          title: { text: "Secure AI systems" }
        }
      ]
    }
  },
  visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
}')

curl -s -X POST "https://api.linkedin.com/v2/ugcPosts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -d "$POST_BODY"
