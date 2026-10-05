create trigger delete_incident_trigger
after delete on report
for each row
execute function supabase_functions.http_request(
  'https://fssiruzvrclqneveicxm.supabase.co/functions/v1/summarize-incident',
  'POST',
  '{"Content-type":"application/json", "Authorization":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc2lydXp2cmNscW5ldmVpY3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NzM5OTAsImV4cCI6MjEwNjI0OTk5MH0.TcxuMY0HzPttXrTXzNrznc0MXYryMS-MTXMcy3_X580"}',
  '{}',
  '1000'
);