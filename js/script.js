// DOM元素
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const resultsContainer = document.getElementById('results-container');
const currentAlbumArt = document.getElementById('current-album-art');
const currentSongTitle = document.getElementById('current-song-title');
const currentSongArtist = document.getElementById('current-song-artist');
const playBtn = document.getElementById('play-btn');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const progressBar = document.getElementById('progress-bar');
const progress = document.getElementById('progress');
const volumeBar = document.getElementById('volume-bar');
const volumeLevel = document.getElementById('volume-level');
const volumeIcon = document.getElementById('volume-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const currentSong = document.getElementById('current-song');

// 歌词大屏元素
const lyricsOverlay = document.getElementById('lyrics-overlay');
const closeBtn = document.getElementById('close-btn');
const largeAlbumArt = document.getElementById('large-album-art');
const largeSongTitle = document.getElementById('large-song-title');
const largeSongArtist = document.getElementById('large-song-artist');
const lyricsScrollArea = document.getElementById('lyrics-scroll-area');
const overlayCurrentTime = document.getElementById('overlay-current-time');
const overlayTotalTime = document.getElementById('overlay-total-time');
const lyricsProgressBar = document.getElementById('lyrics-progress-bar');
const lyricsProgress = document.getElementById('lyrics-progress');
const fontDecreaseBtn = document.getElementById('font-decrease');
const fontIncreaseBtn = document.getElementById('font-increase');
const fontResetBtn = document.getElementById('font-reset');
const fontSizeIndicator = document.getElementById('font-size-indicator');

// 音频播放器
const audio = new Audio();
let isPlaying = false;
let currentTrack = null;
let searchResults = [];
let currentSongIndex = -1;
let isShuffle = false;
let isRepeat = false;
let lyricsData = [];
let activeLyricIndex = -1;
let currentSearchKeyword = '';
let playlists = [];
let currentPlaylistId = null;

// 字体大小控制
let fontSizeScale = 1.0;
const minFontSizeScale = 0.6;
const maxFontSizeScale = 2.0;
const fontSizeStep = 0.1;
const defaultFontSize = 1.4; // 默认字体大小(rem)

// API基础URL
const API_BASE_URL = 'https://api.dragonlongzhu.cn/api/dg_QQmusicflac.php';

// 搜索音乐
async function searchMusic(query) {
    if (!query.trim()) return;
    
    currentSearchKeyword = query;
    
    // 显示加载状态
    resultsContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
    
    try {
        // 调用API搜索歌曲
        const response = await fetch(`${API_BASE_URL}?msg=${encodeURIComponent(query)}&type=json`);
        const data = await response.json();
        
        if (data.code === 200) {
            searchResults = data.data.map(item => ({
                id: item.n,
                title: item.song_title,
                artist: item.song_singer,
                album: '',
                duration: '0:00',
                albumArt: 'https://y.qq.com/music/photo_new/T002R300x300M000003fA5G40k6hKZ.jpg?max_age=2592000',
                audioUrl: '',
                lyric: ''
            }));
            
            displayResults(searchResults);
        } else {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    搜索失败，请稍后再试
                </div>
            `;
        }
    } catch (error) {
        console.error('搜索失败:', error);
        resultsContainer.innerHTML = `
            <div class="no-results">
                搜索失败，请检查网络连接
            </div>
        `;
    }
}

// 显示搜索结果
function displayResults(songs) {
    resultsContainer.innerHTML = '';
    
    if (songs.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                没有找到相关歌曲
            </div>
        `;
        return;
    }
    
    songs.forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.className = 'song-card';
        songElement.innerHTML = `
            <img src="${song.albumArt}" class="album-art" alt="${song.title}">
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
                <span class="song-quality">SQ</span>
            </div>
        `;
        
        songElement.addEventListener('click', () => playSong(song, index));
        resultsContainer.appendChild(songElement);
    });

    // 添加歌单按钮
    addPlaylistButtonsToCards();
}

// 播放歌曲
async function playSong(song, index) {
    try {
        // 获取歌曲详情
        const response = await fetch(`${API_BASE_URL}?msg=${encodeURIComponent(currentSearchKeyword)}&n=${song.id}&type=json`);
        const data = await response.json();
        
        if (data.code !== 200 || !data.data.music_url) {
            alert('获取歌曲信息失败');
            return;
        }
        
        const songDetail = data.data;
        
        currentTrack = {
            id: song.id,
            title: songDetail.song_name,
            artist: songDetail.song_singer,
            album: '',
            duration: '0:00',
            albumArt: songDetail.cover || 'https://y.qq.com/music/photo_new/T002R300x300M000003fA5G40k6hKZ.jpg?max_age=2592000',
            audioUrl: songDetail.music_url,
            lyric: songDetail.lyric || ''
        };
        
        currentSongIndex = index;
        
        // 更新播放器信息
        currentAlbumArt.src = currentTrack.albumArt;
        currentSongTitle.textContent = currentTrack.title;
        currentSongArtist.textContent = currentTrack.artist;
        
        // 设置音频源
        audio.src = currentTrack.audioUrl;
        
        // 播放歌曲
        audio.play();
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        
        // 解析歌词
        parseLyrics(currentTrack.lyric);
        
        // 更新当前歌曲在列表中的样式
        updatePlayingStyle();
        
        // 重置字体大小
        resetFontSize();
    } catch (error) {
        console.error('播放失败:', error);
        alert('播放失败，请稍后再试');
    }
}

// 解析歌词
function parseLyrics(lyric) {
    lyricsData = [];
    lyricsScrollArea.innerHTML = '';
    
    if (!lyric) {
        lyricsScrollArea.innerHTML = '<div class="lyrics-line">暂无歌词</div>';
        return;
    }
    
    // 分割歌词行
    const lines = lyric.split('\\n');
    
    lines.forEach(line => {
        // 匹配时间标签
        const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
        if (timeMatch) {
            const minutes = parseInt(timeMatch[1]);
            const seconds = parseInt(timeMatch[2]);
            const milliseconds = parseInt(timeMatch[3]);
            const time = minutes * 60 + seconds + milliseconds / 1000;
            
            // 提取歌词文本
            const text = line.replace(timeMatch[0], '').trim();
            
            if (text) {
                lyricsData.push({
                    time: time,
                    text: text
                });
                
                // 创建歌词行元素
                const lyricLine = document.createElement('div');
                lyricLine.className = 'lyrics-line';
                lyricLine.textContent = text;
                lyricLine.dataset.time = time;
                
                // 添加点击事件
                lyricLine.addEventListener('click', function() {
                    const time = parseFloat(this.dataset.time);
                    audio.currentTime = time;
                    
                    // 如果当前暂停状态，点击后自动播放
                    if (!isPlaying) {
                        audio.play();
                        isPlaying = true;
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        largeAlbumArt.classList.add('playing');
                    }
                });
                
                lyricsScrollArea.appendChild(lyricLine);
            }
        }
    });
    
    // 如果没有解析到歌词，显示默认信息
    if (lyricsData.length === 0) {
        lyricsScrollArea.innerHTML = '<div class="lyrics-line">歌词加载中...</div>';
    }
    
    // 更新字体大小
    applyFontSize();
}

// 更新播放进度
function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
    lyricsProgress.style.width = `${progressPercent}%`;
    
    // 更新时间显示
    const currentMinutes = Math.floor(currentTime / 60);
    const currentSeconds = Math.floor(currentTime % 60);
    const timeString = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;
    currentTimeEl.textContent = timeString;
    overlayCurrentTime.textContent = timeString;
    
    // 更新总时间
    if (duration) {
        const totalMinutes = Math.floor(duration / 60);
        const totalSeconds = Math.floor(duration % 60);
        const totalTimeString = `${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}`;
        totalTimeEl.textContent = totalTimeString;
        overlayTotalTime.textContent = totalTimeString;
    }
    
    // 更新歌词高亮
    updateLyricsHighlight(currentTime);
}

// 更新歌词高亮
function updateLyricsHighlight(currentTime) {
    // 找到当前时间对应的歌词行
    let currentIndex = -1;
    
    for (let i = 0; i < lyricsData.length; i++) {
        if (currentTime >= lyricsData[i].time) {
            currentIndex = i;
        } else {
            break;
        }
    }
    
    // 如果没有找到匹配的歌词行
    if (currentIndex === -1) return;
    
    // 如果当前歌词行与之前相同，不需要更新
    if (currentIndex === activeLyricIndex) return;
    
    // 移除之前的高亮
    const activeLines = document.querySelectorAll('.lyrics-line.active');
    activeLines.forEach(line => line.classList.remove('active'));
    
    // 添加新高亮
    const lyricLines = document.querySelectorAll('.lyrics-line');
    if (lyricLines[currentIndex]) {
        lyricLines[currentIndex].classList.add('active');
        activeLyricIndex = currentIndex;
        
        // 滚动到当前歌词行
        if (lyricsOverlay.classList.contains('active')) {
            lyricLines[currentIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
}

// 设置进度
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    
    audio.currentTime = (clickX / width) * duration;
}

// 播放/暂停
function togglePlay() {
    if (currentTrack) {
        if (isPlaying) {
            audio.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            largeAlbumArt.classList.remove('playing');
        } else {
            audio.play();
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            largeAlbumArt.classList.add('playing');
        }
        isPlaying = !isPlaying;
    } else if (searchResults.length > 0) {
        // 如果没有当前歌曲，播放第一首
        playSong(searchResults[0], 0);
    }
}

// 更新当前播放歌曲样式
function updatePlayingStyle() {
    const songCards = document.querySelectorAll('.song-card');
    songCards.forEach((card, index) => {
        if (index === currentSongIndex) {
            card.style.boxShadow = '0 0 15px rgba(49, 198, 255, 0.5)';
            card.style.border = '1px solid #31c6ff';
        } else {
            card.style.boxShadow = '';
            card.style.border = 'none';
        }
    });
}

// 打开歌词大屏
function openLyricsOverlay() {
    if (!currentTrack) return;
    
    // 更新大屏内容
    largeAlbumArt.src = currentTrack.albumArt;
    largeSongTitle.textContent = currentTrack.title;
    largeSongArtist.textContent = currentTrack.artist;
    
    // 添加播放状态类
    if (isPlaying) {
        largeAlbumArt.classList.add('playing');
    } else {
        largeAlbumArt.classList.remove('playing');
    }
    
    // 显示大屏
    lyricsOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 关闭歌词大屏
function closeLyricsOverlay() {
    lyricsOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    largeAlbumArt.classList.remove('playing');
}

// 初始化歌单
function initPlaylists() {
    const savedPlaylists = localStorage.getItem('qq-music-playlists');
    if (savedPlaylists) {
        playlists = JSON.parse(savedPlaylists);
    } else {
        // 默认歌单
        playlists = [
            {
                id: 'default',
                name: '默认歌单',
                songs: []
            }
        ];
        savePlaylists();
    }
    renderPlaylists();
}

// 保存歌单到本地存储
function savePlaylists() {
    localStorage.setItem('qq-music-playlists', JSON.stringify(playlists));
}

// 渲染歌单列表
function renderPlaylists() {
    const playlistList = document.getElementById('playlist-list');
    playlistList.innerHTML = '';
    
    playlists.forEach(playlist => {
        const playlistItem = document.createElement('div');
        playlistItem.className = `playlist-item ${playlist.id === currentPlaylistId ? 'active' : ''}`;
        playlistItem.innerHTML = `
            <span>${playlist.name}</span>
            <div class="playlist-item-actions">
                <button class="playlist-play-btn" data-id="${playlist.id}">
                    <i class="fas fa-play"></i>
                </button>
                <button class="playlist-delete-btn" data-id="${playlist.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        playlistItem.addEventListener('click', (e) => {
            if (!e.target.closest('.playlist-item-actions')) {
                currentPlaylistId = playlist.id;
                renderPlaylists();
                renderPlaylistSongs(playlist.id);
            }
        });
        
        playlistList.appendChild(playlistItem);
    });
    
    // 添加播放和删除按钮事件
    document.querySelectorAll('.playlist-play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const playlistId = btn.dataset.id;
            playPlaylist(playlistId);
        });
    });
    
    document.querySelectorAll('.playlist-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const playlistId = btn.dataset.id;
            deletePlaylist(playlistId);
        });
    });
}

// 渲染当前歌单的歌曲
function renderPlaylistSongs(playlistId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    resultsContainer.innerHTML = '<h2 class="section-title">当前歌单</h2>';
    
    if (playlist.songs.length === 0) {
        resultsContainer.innerHTML += `
            <div class="no-results">
                这个歌单是空的，快去添加歌曲吧！
            </div>
        `;
        return;
    }
    
    const songsContainer = document.createElement('div');
    songsContainer.className = 'results-container';
    
    playlist.songs.forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.className = 'song-card';
        songElement.innerHTML = `
            <img src="${song.albumArt}" class="album-art" alt="${song.title}">
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
                <span class="song-quality">SQ</span>
            </div>
        `;
        
        songElement.addEventListener('click', () => {
            playSongFromPlaylist(song, index, playlistId);
        });
        
        songsContainer.appendChild(songElement);
    });
    
    resultsContainer.appendChild(songsContainer);
}

// 播放歌单中的歌曲
function playSongFromPlaylist(song, index, playlistId) {
    currentSongIndex = index;
    currentTrack = song;
    currentPlaylistId = playlistId;
    
    // 更新播放器信息
    currentAlbumArt.src = song.albumArt;
    currentSongTitle.textContent = song.title;
    currentSongArtist.textContent = song.artist;
    
    // 设置音频源
    audio.src = song.audioUrl;
    
    // 播放歌曲
    audio.play();
    isPlaying = true;
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    
    // 解析歌词
    parseLyrics(song.lyric);
    
    // 更新当前歌曲在列表中的样式
    updatePlayingStyle();
    
    // 重置字体大小
    resetFontSize();
}

// 播放整个歌单
function playPlaylist(playlistId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || playlist.songs.length === 0) return;
    
    currentPlaylistId = playlistId;
    playSongFromPlaylist(playlist.songs[0], 0, playlistId);
    renderPlaylists();
}

// 删除歌单
function deletePlaylist(playlistId) {
    if (playlistId === 'default') {
        alert('不能删除默认歌单');
        return;
    }
    
    if (confirm('确定要删除这个歌单吗？')) {
        playlists = playlists.filter(p => p.id !== playlistId);
        if (currentPlaylistId === playlistId) {
            currentPlaylistId = 'default';
        }
        savePlaylists();
        renderPlaylists();
        renderPlaylistSongs(currentPlaylistId);
    }
}

// 创建新歌单
function createNewPlaylist(name) {
    if (!name.trim()) return;
    
    const newPlaylist = {
        id: 'playlist-' + Date.now(),
        name: name.trim(),
        songs: []
    };
    
    playlists.push(newPlaylist);
    savePlaylists();
    renderPlaylists();
}

// 添加当前歌曲到歌单
function addCurrentToPlaylist(playlistId) {
    if (!currentTrack) return;
    
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    // 检查是否已经存在
    const exists = playlist.songs.some(song => song.id === currentTrack.id);
    if (exists) {
        alert('这首歌已经在歌单中了');
        return;
    }
    
    playlist.songs.push({
        ...currentTrack,
        addedAt: new Date().toISOString()
    });
    
    savePlaylists();
    if (currentPlaylistId === playlistId) {
        renderPlaylistSongs(playlistId);
    }
    
    alert('已添加到歌单: ' + playlist.name);
}

// 在搜索结果歌曲卡片上添加"添加到歌单"按钮
function addPlaylistButtonsToCards() {
    document.querySelectorAll('.song-card').forEach(card => {
        const addToPlaylistBtn = document.createElement('div');
        addToPlaylistBtn.className = 'add-to-playlist-btn';
        addToPlaylistBtn.innerHTML = '<i class="fas fa-plus"></i> 添加到歌单';
        addToPlaylistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showAddToPlaylistMenu(card);
        });
        card.appendChild(addToPlaylistBtn);
    });
}

// 显示添加到歌单的菜单
function showAddToPlaylistMenu(card) {
    const menu = document.createElement('div');
    menu.className = 'playlist-menu';
    menu.innerHTML = '<h4>添加到歌单</h4>';
    
    playlists.forEach(playlist => {
        const item = document.createElement('div');
        item.className = 'playlist-menu-item';
        item.textContent = playlist.name;
        item.addEventListener('click', () => {
            const songIndex = Array.from(card.parentNode.children).indexOf(card);
            const song = searchResults[songIndex];
            addSongToPlaylist(song, playlist.id);
            menu.remove();
        });
        menu.appendChild(item);
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn';
    closeBtn.textContent = '取消';
    closeBtn.addEventListener('click', () => menu.remove());
    menu.appendChild(closeBtn);
    
    card.appendChild(menu);
}

// 添加歌曲到歌单
function addSongToPlaylist(song, playlistId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    // 检查是否已经存在
    const exists = playlist.songs.some(s => s.id === song.id);
    if (exists) {
        alert('这首歌已经在歌单中了');
        return;
    }
    
    playlist.songs.push({
        ...song,
        addedAt: new Date().toISOString()
    });
    
    savePlaylists();
    if (currentPlaylistId === playlistId) {
        renderPlaylistSongs(playlistId);
    }
    
    alert('已添加到歌单: ' + playlist.name);
}

// 设置音量
function setVolume(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const volume = clickX / width;
    
    audio.volume = volume;
    volumeLevel.style.width = `${volume * 100}%`;
    
    // 更新音量图标
    if (volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

// 调整字体大小
function adjustFontSize(delta) {
    fontSizeScale += delta;
    
    // 限制字体大小范围
    fontSizeScale = Math.max(minFontSizeScale, Math.min(fontSizeScale, maxFontSizeScale));
    
    // 应用新的字体大小
    applyFontSize();
    
    // 保存字体大小偏好
    localStorage.setItem('lyricFontScale', fontSizeScale);
}

// 应用字体大小
function applyFontSize() {
    const lyricLines = document.querySelectorAll('.lyrics-line');
    const baseSize = defaultFontSize * fontSizeScale;
    
    lyricLines.forEach(line => {
        line.style.fontSize = `${baseSize}rem`;
    });
    
    // 更新激活歌词的字体大小
    const activeLines = document.querySelectorAll('.lyrics-line.active');
    activeLines.forEach(line => {
        line.style.fontSize = `${baseSize * 1.15}rem`; // 激活歌词比普通歌词大15%
    });
    
    // 更新字体大小指示器
    fontSizeIndicator.textContent = `字体大小: ${Math.round(fontSizeScale * 100)}%`;
}

// 重置字体大小
function resetFontSize() {
    fontSizeScale = 1.0;
    applyFontSize();
    localStorage.setItem('lyricFontScale', fontSizeScale);
}

// 加载保存的字体大小
function loadFontSize() {
    const savedScale = localStorage.getItem('lyricFontScale');
    if (savedScale) {
        fontSizeScale = parseFloat(savedScale);
        applyFontSize();
    }
}

// 事件监听
searchBtn.addEventListener('click', () => searchMusic(searchInput.value));
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchMusic(searchInput.value);
    }
});
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => {
    if (searchResults.length > 0) {
        const newIndex = (currentSongIndex - 1 + searchResults.length) % searchResults.length;
        playSong(searchResults[newIndex], newIndex);
    }
});
nextBtn.addEventListener('click', () => {
    if (searchResults.length > 0) {
        const newIndex = (currentSongIndex + 1) % searchResults.length;
        playSong(searchResults[newIndex], newIndex);
    }
});
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', () => {
    if (searchResults.length > 0) {
        const newIndex = (currentSongIndex + 1) % searchResults.length;
        playSong(searchResults[newIndex], newIndex);
    }
});
progressBar.addEventListener('click', setProgress);
lyricsProgressBar.addEventListener('click', setProgress);
currentSong.addEventListener('click', openLyricsOverlay);
closeBtn.addEventListener('click', closeLyricsOverlay);
volumeBar.addEventListener('click', setVolume);

// 字体大小控制
fontDecreaseBtn.addEventListener('click', () => adjustFontSize(-fontSizeStep));
fontIncreaseBtn.addEventListener('click', () => adjustFontSize(fontSizeStep));
fontResetBtn.addEventListener('click', resetFontSize);

// Ctrl+滚轮调整字体大小
lyricsScrollArea.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        adjustFontSize(e.deltaY > 0 ? -fontSizeStep : fontSizeStep);
    }
});

// 在初始化部分添加
document.addEventListener('DOMContentLoaded', () => {
    initPlaylists();
    
    // 歌单按钮事件
    document.getElementById('playlist-btn').addEventListener('click', () => {
        document.getElementById('playlist-sidebar').classList.add('active');
    });
    
    document.getElementById('close-playlist-btn').addEventListener('click', () => {
        document.getElementById('playlist-sidebar').classList.remove('active');
    });
    
    // 新建歌单
    document.getElementById('create-playlist-btn').addEventListener('click', () => {
        document.getElementById('new-playlist-modal').classList.add('active');
    });
    
    document.getElementById('cancel-new-playlist').addEventListener('click', () => {
        document.getElementById('new-playlist-modal').classList.remove('active');
    });
    
    document.getElementById('confirm-new-playlist').addEventListener('click', () => {
        const name = document.getElementById('new-playlist-name').value;
        createNewPlaylist(name);
        document.getElementById('new-playlist-modal').classList.remove('active');
        document.getElementById('new-playlist-name').value = '';
    });
    
    // 添加到当前歌单按钮
    const addToCurrentPlaylistBtn = document.createElement('button');
    addToCurrentPlaylistBtn.className = 'control-btn';
    addToCurrentPlaylistBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addToCurrentPlaylistBtn.title = '添加到当前歌单';
    addToCurrentPlaylistBtn.addEventListener('click', () => {
        if (currentTrack && currentPlaylistId) {
            addCurrentToPlaylist(currentPlaylistId);
        } else {
            alert('请先选择歌单');
        }
    });
    
    // 添加到控制按钮区域
    document.querySelector('.control-buttons').appendChild(addToCurrentPlaylistBtn);
});


// 初始音量设置
audio.volume = 0.8;
volumeLevel.style.width = '80%';

// 加载保存的字体大小
loadFontSize();

// 初始化 - 搜索示例
searchMusic('周杰伦');