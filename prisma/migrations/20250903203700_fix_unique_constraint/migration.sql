-- Drop the problematic unique constraint that prevents multiple historical versions
DROP INDEX "SubmissionProduct_submissionId_sku_isCurrent_key";

-- Create a partial unique index that only enforces uniqueness when isCurrent = true
-- This allows multiple historical versions with isCurrent = false
CREATE UNIQUE INDEX "SubmissionProduct_submissionId_sku_current_unique" 
ON "SubmissionProduct"("submissionId", "sku") 
WHERE "isCurrent" = true;
