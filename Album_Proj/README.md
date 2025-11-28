# AlbumProj (React Native)

Mobile app that ingests all photos/videos from the device gallery on launch, extracts creation timestamps/EXIF, uploads each file to Amazon S3, stores metadata + face detections locally, and lets users filter by date or face.

## Setup
- Install dependencies: `yarn install` (or `npm install`).
- iOS pods: `cd ios && pod install`.
- Fill AWS config in `src/config/aws.ts` (`region`, `bucket`, credentials, optional prefix).
- Run Metro: `yarn start`.
- Launch: `yarn android` or `yarn ios`.

## Key Libraries
- Gallery: `@react-native-camera-roll/camera-roll`
- Permissions: `react-native-permissions`
- S3 uploads: `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`
- Face detection: `@react-native-ml-kit/face-detection`
- Local DB: `realm`
- Date picker: `@react-native-community/datetimepicker`

## Permissions
### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```
Add provider if required by CameraRoll (RN 0.73 default): ensure `android:requestLegacyExternalStorage="true"` for API 28 if needed.

### iOS (`ios/AlbumProj/Info.plist`)
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Allow access to scan and upload your photos.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Allow saving uploads.</string>
<key>NSCameraUsageDescription</key>
<string>Allow detecting faces in your photos.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Allow video metadata processing.</string>
```

## Face Detection
- Uses ML Kit on-device via `@react-native-ml-kit/face-detection`.
- Detections run during ingestion; detected face IDs are stored in Realm and can be used to filter media on the Faces screen.

## Performance Notes
- Ingestion pulls gallery items in batches (200 at a time) to limit memory.
- Uploads are sequential in the sample for clarity; parallelize with a queue if needed.
- All data is cached in Realm so subsequent loads filter instantly.

## Environment / Credentials
- Never commit secrets. Use `.env` or native config to inject keys, then load them into `awsConfig`.
- Lock down the S3 bucket to least-privilege IAM; presigned uploads are recommended for production.

## What's Implemented
- Auto-ingest on app launch with permission checks.
- EXIF extraction, S3 upload, creation-date capture, media type, filename storage.
- Date picker filters gallery by original creation date.
- Face detection UI to select a face and filter media containing it.

## Native Project
- `android/` and `ios/` are from `react-native init` (RN 0.73.6) and use bundle id/package `com.albumproj`.
- iOS: run `cd ios && pod install` before opening `AlbumProj.xcodeproj`/`xcworkspace`.
- Android: ensure an emulator/device is running, then `npm run android`.


