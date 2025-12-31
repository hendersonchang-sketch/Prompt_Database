---
description: Check available Gemini models and update the reference list
---

# Workflow: Check & Update Gemini Models

This workflow verifies the currently available Google Gemini models using the project's utility script and updates the documentation.

1. **Run the check script**
   Execute the helper script to query the Google GenAI API.
   ```bash
   node scripts/check_models.js
   ```

2. **Update Documentation**
   - Read the output from the command above.
   - Update `MODEL_LIST.md` with the new list of models.
   - If a significantly newer model is found (e.g., `gemini-1.5-pro` became available, or `gemini-3.0`), propose updating `app/api/` routes to the user.

3. **Verification**
   - Confirm `MODEL_LIST.md` is saved.
   - Notify the user of the latest available "Pro" and "Flash" models.
