import { forwardRef, useImperativeHandle, useState } from 'react';
import {
  launchCameraAsync,
  requestCameraPermissionsAsync,
} from './imagePicker.web.js';

export const CameraView = forwardRef(function CameraView(
  { children, facing = 'front', className = '', ...props },
  ref,
) {
  useImperativeHandle(ref, () => ({
    async takePictureAsync() {
      const result = await launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        throw new Error('Capture canceled');
      }

      return {
        uri: result.assets[0].uri,
      };
    },
  }));

  return (
    <div
      className={`camera-view ${className}`.trim()}
      data-facing={facing}
      {...props}
    >
      {children}
    </div>
  );
});

export function useCameraPermissions() {
  const [permission, setPermission] = useState({
    granted: false,
    status: 'undetermined',
  });

  async function requestPermission() {
    const nextPermission = await requestCameraPermissionsAsync();
    setPermission(nextPermission);
    return nextPermission;
  }

  return [permission, requestPermission];
}
