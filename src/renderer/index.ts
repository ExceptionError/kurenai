/* eslint-disable @typescript-eslint/no-non-null-assertion */

const { api } = window;

let playList: string[] = [];
let playIndex = -1;

const $ = (id: string) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  initDocument();
  initTitleBar();
  initAudioControl();
  initPlayControl();
  initDrop();
  initWindow();
});

function initDocument() {
  window.addEventListener('keydown', event => event.preventDefault());
}

function initTitleBar() {
  $('close')!.addEventListener('click', () => window.close());
  $('icon')!.addEventListener('dblclick', () => window.close());
}

function initAudioControl() {
  const play = $('play')!;
  const pause = $('pause')!;
  const stop = $('stop')!;

  const time = $('time')!;
  const seek = $('seek')! as HTMLInputElement;
  const volume = $('volume')! as HTMLInputElement;

  const audio = $('audio')! as HTMLAudioElement;

  let isSeeking = false;
  audio.volume = volume.valueAsNumber = parseFloat(localStorage.getItem('volume') || '1');

  play.addEventListener('click', () => audio.play());
  pause.addEventListener('click', () => audio.pause());
  stop.addEventListener('click', () => {
    audio.pause();
    audio.currentTime = 0;
  });

  seek.addEventListener('click', () => {
    audio.currentTime = seek.valueAsNumber;
  });
  seek.addEventListener('mousedown', () => (isSeeking = true));
  seek.addEventListener('mouseup', () => (isSeeking = false));

  const updateVolume = () => (audio.volume = volume.valueAsNumber);
  volume.addEventListener('input', updateVolume);
  volume.addEventListener('click', () => {
    updateVolume();
    localStorage.setItem('volume', volume.value);
  });

  audio.addEventListener('timeupdate', () => {
    const current = audio.currentTime;
    const duration = audio.duration;
    if (isNaN(current) || isNaN(duration)) return;

    const indexLabel = (playIndex + 1).toString().padStart(3, '0');
    const newLabel = `${indexLabel} - ${format(current)} / ${format(duration)}`;
    time.textContent = newLabel;
    seek.max = duration.toString();
    if (!isSeeking) {
      seek.valueAsNumber = current;
    }
  });

  audio.addEventListener('ended', playNext);
}

function format(time: number): string {
  const hours = Math.floor(time / 60 / 60);
  const minutes = Math.floor(time / 60) % 60;
  const seconds = Math.floor(time - minutes * 60);

  const elements = [minutes, seconds];
  if (hours > 0) {
    elements.unshift(hours);
  }

  return elements.map(v => v.toString().padStart(2, '0')).join(':');
}

function initPlayControl() {
  const prev = $('prev')!;
  const next = $('next')!;
  const file = $('file')!;
  const folder = $('folder')!;

  prev.addEventListener('click', playPrev);
  next.addEventListener('click', playNext);
  file.addEventListener('click', async () => handleFiles(await api.file()));
  folder.addEventListener('click', async () => handleFiles(await api.folder()));
}

function initDrop() {
  document.body.addEventListener('dragover', event => {
    document.body.style.opacity = '50%';
    event.preventDefault();
  });
  document.body.addEventListener('dragleave', event => {
    document.body.style.opacity = '100%';
    event.preventDefault();
  });
  document.addEventListener('drop', async event => {
    document.body.style.opacity = '100%';
    if (!event.dataTransfer) return;
    const filePaths = Array.from(event.dataTransfer.files).map(_ => _.path);
    handleFiles(await api.drop(filePaths));
  });
}

function initWindow() {
  api.show();
}

function playPrev() {
  if (playList.length === 0) return;

  playIndex = playIndex === 0 ? playList.length - 1 : playIndex - 1;
  playStart();
}

function playNext() {
  if (playList.length === 0) return;

  playIndex = playIndex === playList.length - 1 ? 0 : playIndex + 1;
  playStart();
}

async function playStart() {
  if (playIndex === -1) return;

  const audio = $('audio')! as HTMLAudioElement;
  const info = $('info')!;

  const filePath = playList[playIndex];
  audio.src = await api.getAudio(filePath);
  const name = api.baseName(filePath);
  info.textContent = name;
  document.title = `${name} - KURENAI`;
}

function handleFiles(files?: string[]) {
  console.log(files);
  if (!files || files.length === 0) return;
  playList = playList.concat(files);
  playIndex = playList.length - files.length;
  playStart();
}
