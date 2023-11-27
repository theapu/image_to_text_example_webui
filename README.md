# image_to_text_example_webui
## Example web ui for google vision API image to text
1. Create a project for using cloud vision api and credentials in https://console.cloud.google.com/
2. Copy project credentials json from console.cloud.google.com to credentials folder
3. Install node modules.
```
npm install --save
```
4. Run using
```
node index.js --credentials <googel vision api credentials file>
```
Example:
```
node index.js --credentials credentials/home-vision-api.json
```
