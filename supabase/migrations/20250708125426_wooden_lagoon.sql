-- Add function to handle form submission with specialized fields
CREATE OR REPLACE FUNCTION submit_form_record(
  form_id TEXT,
  record_data JSONB,
  employee_id TEXT DEFAULT NULL,
  amount DECIMAL DEFAULT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  submitted_by TEXT DEFAULT 'anonymous',
  ip_address TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  target_table TEXT;
  new_record_id TEXT;
BEGIN
  -- Get the target table for this form
  SELECT storage_table INTO target_table
  FROM form_table_mappings
  WHERE form_id = submit_form_record.form_id;
  
  -- If no mapping exists, create one
  IF target_table IS NULL THEN
    target_table := assign_form_to_record_table(submit_form_record.form_id);
  END IF;
  
  -- Generate a new record ID
  new_record_id := gen_random_uuid()::text;
  
  -- Insert the record into the appropriate table
  EXECUTE format('
    INSERT INTO %I (
      id, form_id, record_data, employee_id, amount, date, 
      submitted_by, submitted_at, ip_address, user_agent, 
      status, created_at, updated_at
    )
    VALUES (
      %L, %L, %L, %L, %L, %L,
      %L, NOW(), %L, %L,
      ''submitted'', NOW(), NOW()
    )
  ', 
  target_table, 
  new_record_id, 
  submit_form_record.form_id, 
  submit_form_record.record_data,
  submit_form_record.employee_id,
  submit_form_record.amount,
  submit_form_record.date,
  submit_form_record.submitted_by,
  submit_form_record.ip_address,
  submit_form_record.user_agent
  );
  
  RETURN new_record_id;
END;
$$ LANGUAGE plpgsql;

-- Function to extract specialized fields from record data
CREATE OR REPLACE FUNCTION extract_specialized_fields(record_data JSONB)
RETURNS TABLE(employee_id TEXT, amount DECIMAL, date TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT
    record_data->>'employee_id' AS employee_id,
    (record_data->>'amount')::DECIMAL AS amount,
    (record_data->>'date')::TIMESTAMP WITH TIME ZONE AS date;
END;
$$ LANGUAGE plpgsql;

-- Function to get record count for a form across all tables
CREATE OR REPLACE FUNCTION get_form_record_count(form_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  target_table TEXT;
  record_count INTEGER := 0;
BEGIN
  -- Get the target table for this form
  SELECT storage_table INTO target_table
  FROM form_table_mappings
  WHERE form_id = get_form_record_count.form_id;
  
  -- If no mapping exists, return 0
  IF target_table IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count records in the appropriate table
  EXECUTE format('
    SELECT COUNT(*) FROM %I WHERE form_id = %L
  ', target_table, get_form_record_count.form_id) INTO record_count;
  
  RETURN record_count;
END;
$$ LANGUAGE plpgsql;