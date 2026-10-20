// Utility to convert an audio Blob or AudioBuffer to standard 16-bit PCM WAV.
// Works seamlessly in all modern browsers via Web Audio API.

export async function convertBlobToWav(audioBlob: Blob, targetSampleRate = 22050): Promise<Blob> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  // Decode audio using browser's built-in Web Audio API AudioContext
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return encodeAudioBufferToWav(audioBuffer, targetSampleRate);
  } finally {
    if (audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
  }
}

export function encodeAudioBufferToWav(audioBuffer: AudioBuffer, targetSampleRate = 22050): Promise<Blob> {
  // If targetSampleRate matches and is mono, fast path
  const numChannels = 1; // Mono
  const srcSampleRate = audioBuffer.sampleRate;
  
  // Extract mono channel (downmix if stereo)
  let channelData: Float32Array;
  if (audioBuffer.numberOfChannels === 1) {
    channelData = audioBuffer.getChannelData(0);
  } else {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    channelData = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      channelData[i] = (left[i] + right[i]) * 0.5;
    }
  }

  // Resample if necessary using linear interpolation
  let samples: Float32Array;
  if (srcSampleRate === targetSampleRate) {
    samples = channelData;
  } else {
    const ratio = srcSampleRate / targetSampleRate;
    const newLength = Math.round(channelData.length / ratio);
    samples = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIdx = i * ratio;
      const lower = Math.floor(srcIdx);
      const upper = Math.min(lower + 1, channelData.length - 1);
      const weight = srcIdx - lower;
      samples[i] = channelData[lower] * (1 - weight) + channelData[upper] * weight;
    }
  }

  // Write WAV RIFF header and 16-bit PCM samples
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = targetSampleRate * blockAlign;
  const dataByteLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length minus 8 bytes of RIFF header
  view.setUint32(4, 36 + dataByteLength, true);
  // RIFF type & format header
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, targetSampleRate, true);
  // byte rate
  view.setUint32(28, byteRate, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataByteLength, true);

  // Write 16-bit PCM samples (clamped between -1 and 1)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    // 16-bit signed integer conversion
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return Promise.resolve(new Blob([view], { type: 'audio/wav' }));
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
