kintai-functions
===

## deploy

`$ gcloud --project ${project} functions deploy kintai --trigger-http --runtime nodejs10 --set-env-vars TZ=Asia/Tokyo --allow-unauthenticated`

I recommend to allocate memory 1GB or higher. Or Puppeteer works slow.

## api

```sh
$ curl -X POST -H 'Content-Type: application/json' -d @-<<JSON https://${region}-${project}.cloudfunctions.net/kintai
{
  "company": "YOURCOMPANYD",
  "employee": "90098",
  "password": "******",
  "action": "in"
}
JSON
```

- `action`
  - `in`: check-in, start work
  - `out`: check-out, leave work
  - `auto`: check-in when 08:00 ~ 15:59, check-out when else
