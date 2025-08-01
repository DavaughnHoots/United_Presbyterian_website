-- First, check if you have a user account
-- Replace 'your-email@example.com' with your actual email
SELECT id, email, full_name FROM users WHERE email = 'your-email@example.com';

-- Once you have your user ID, create a UserJourney enrollment
-- Replace 'YOUR_USER_ID' with your actual user ID from above
INSERT INTO user_journeys (
    id,
    user_id,
    journey_id,
    start_date,
    current_day,
    is_active,
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'YOUR_USER_ID',
    'd732bece-39f1-4015-8c1d-5f3f02d88212',  -- Finding Peace journey
    CURRENT_DATE,  -- Start today
    1,  -- Current day 1
    true,  -- Active
    NOW(),
    NOW()
);

-- Verify the enrollment
SELECT 
    uj.*,
    j.title as journey_title,
    u.email as user_email
FROM user_journeys uj
JOIN journeys j ON uj.journey_id = j.id
JOIN users u ON uj.user_id = u.id
WHERE j.id = 'd732bece-39f1-4015-8c1d-5f3f02d88212';