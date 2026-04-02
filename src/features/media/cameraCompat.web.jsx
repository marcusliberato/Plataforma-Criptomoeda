import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

function isCameraSupported() {
  return !!navigator.mediaDevices?.getUserMedia;
}

function getFacingModeValue(facing) {
  return facing === 'front' ? 'user' : 'environment';
}

export const CameraView = forwardRef(function CameraView(
  { children, facing = 'front', className = '', ...props },
  ref,
) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [streamError, setStreamError] = useState('');

  useEffect(() => {
    let active = true;

    async function startStream() {
      if (!isCameraSupported()) {
        if (active) {
          setStreamError('A webcam não é suportada neste navegador.');
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: getFacingModeValue(facing),
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setStreamError('');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (error) {
        if (active) {
          setStreamError(
            error instanceof Error && error.message
              ? error.message
              : 'Não foi possível acessar a webcam.',
          );
        }
      }
    }

    startStream();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [facing]);

  useImperativeHandle(ref, () => ({
    async takePictureAsync() {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) {
        throw new Error('Camera not ready');
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas not available');
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const uri = canvas.toDataURL('image/jpeg', 0.92);

      return {
        uri,
      };
    },
  }));

  return (
    <div
      className={`camera-view ${className}`.trim()}
      data-facing={facing}
      {...props}
    >
      {streamError ? (
        <div className='camera-overlay'>{streamError}</div>
      ) : (
        <>
          <video
            ref={videoRef}
            className='camera-video'
            autoPlay
            muted
            playsInline
          />
          {children}
        </>
      )}
    </div>
  );
});

export function useCameraPermissions() {
  const [permission, setPermission] = useState({
    granted: false,
    status: 'undetermined',
  });

  async function requestPermission() {
    if (!isCameraSupported()) {
      const unsupportedPermission = {
        granted: false,
        status: 'unsupported',
      };
      setPermission(unsupportedPermission);
      return unsupportedPermission;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      stream.getTracks().forEach((track) => track.stop());

      const nextPermission = {
        granted: true,
        status: 'granted',
      };
      setPermission(nextPermission);
      return nextPermission;
    } catch {
      const nextPermission = {
        granted: false,
        status: 'denied',
      };
      setPermission(nextPermission);
      return nextPermission;
    }
  }

  return [permission, requestPermission];
}
