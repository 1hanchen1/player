const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

// 处理搜索表单提交事件
searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    searchMusic(searchInput.value);
});

// 处理搜索按钮点击事件
searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchMusic(searchInput.value);
    }
});



async function searchMusic(keyword) {
    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const test_key = `QQhhlqilongzhu.cnTest`;
        const sign = md5(`${test_key}${timestamp}${keyword}${test_key}`);
        const sign_new = md5(`${test_key}${sign}${timestamp}${keyword}${test_key}`);
        const response = await fetch(`https://www.hhlqilongzhu.cn/ziyuan/Music/API/QQ_Search.php?msg=${encodeURIComponent(keyword)}&timestamp=${timestamp}&signature=${sign_new}`);
        const data = await response.json();
        var musicInfoArray = [];
        // 获取音乐列表数据
        const musicList = data.data;

        // 获取ul元素
        const ul = document.getElementById('musicList-right');
        ul.innerHTML = ''; // 清空列表

        // 遍历音乐列表，创建li元素显示音乐信息
        musicList.forEach((music, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <img src="${music.pic}" alt="${music.name}">
                <div>
                    <h2>${music.name}</h2>
                    <p>${music.artist}</p>
                    <lrc>${music.lrc}</lrc>
                    <url>${music.url}</url>
                </div>
                <i class="fas fa-plus icon guigui_icon" data-index="${index}"></i>
            `;
            ul.appendChild(li);
        });


        // 使用 Promise 封装异步添加歌曲到数�?
        function addMusicToArray(selectedMusic, musicInfoArray) {
            return new Promise((resolve) => {
                // 创建音乐信息对象
                const musicInfo = {
                    name: selectedMusic.name,
                    artist: selectedMusic.artist,
                    pic: selectedMusic.pic,
                    lrc: selectedMusic.lrc,
                    url: selectedMusic.url
                };
                // 将音乐信息添加到数组�?
                musicInfoArray.push(musicInfo);
                console.log('歌曲已添�?:', musicInfo);
                document.getElementById('download').href = selectedMusic.url;
                resolve(); // 异步操作完成
            });
        }

        // 为每一�? li 元素上的加号图标添加点击事件
        const addIcons = document.querySelectorAll('.guigui_icon');
        addIcons.forEach(icon => {
            icon.addEventListener('click', async function (e) {
                const index = parseInt(this.getAttribute('data-index'));
                const selectedMusic = musicList[index];
                await addMusicToArray(selectedMusic, musicInfoArray); // 等待异步操作完成
                mainCode(musicInfoArray); // 传递更新后�? musicInfoArray
            });
        });

        //获取所有播放全部按�?
        const all_play_buttons = document.querySelectorAll('#guigui_pay_all');

        //遍历每个播放全部按钮,为其添加点击事件
        all_play_buttons.forEach(button => {
            button.addEventListener('click', async function (e) {
                // 清空 musicInfoArray 数组
                musicInfoArray = [];

                // 使用 Promise.all 同时异步添加所有歌�?
                await Promise.all(musicList.map(music => addMusicToArray(music, musicInfoArray)));

                console.log('全部歌曲信息:', musicInfoArray);
                mainCode(musicInfoArray);
            });
        });
    } catch (error) {
        console.error('没有搜到，好像接口挂了~', error);
    }
}


function mainCode(data) {

    var globalPlayFlag = true;

    var audio = $('audio').get(0),
        $doc = $('html,body'),
        $playerContainer = $('.player-container');//播放器界面主�?

    var $musicListNum = $('.musicList-num>span'),//播放列表主体�?
        $musicListBody = $('.musicList-body'),//播放列表区中的歌曲总数显示�?
        $musicListClearAll = $('.musicList-clearAll');

    var $musicPlaybill = $('.singer-headshot>img'),//海报图片
        $musicHeadline = $('.music-headline'),//音乐名字
        $musicSinger = $('.singer-name-cur'),//歌手名字
        $musicAlbum = $('.album-name-cur'),//专辑名字
        $musicLyric = $('.music-lyric-list'),//歌词展示�?
        $lyricTimeVal = $('.lyricTimeVal'),//歌词显示区拖动展示的时间
        $smallPlayIcon = $('.small-play-icon'),//歌词显示区拖动展示的播放按钮
        $lyricTimeLine = $('.lyricTimeLine'),//实时时间�?
        $fullscreenBtn = $('.fullscreen-btn');

    var $progressbar = $('.play-progressbar'),//播放进度�?
        $progressbarCur = $progressbar.find('.play-cur-progressbar'),//实时播放进度�?
        $progressbarCurDot = $progressbar.find('.time-schedule'),
        $volumebar = $('.volume-bar'),//音量�?
        $volumebarCur = $volumebar.find('.volume-cur-bar'),//实时音量�?
        $volumebarCurDot = $volumebar.find('.dynamic-btn');

    var $musicPlaybillSmall = $('.playbill-small'),
        $byOrder = $('.by-order'),//播放顺序按钮
        $playPauseBtn = $('.global-audio-ctrl'),//底部中央暂停-播放按钮
        $curTime = $('.cut-time'),//currenttime显示�?
        $fixedTime = $('.fixed-time'),//duration显示�?
        $footctrlMusic = $('.footctrl-singer'),
        $footctrlSinger = $('.footctrl-music'),
        $volumeIcon = $('.volume-icon'),
        $nextMusic = $('.next-music'),
        $prevMusic = $('.prev-music');

    var progressbar = new Progressbar($progressbar, $progressbarCur, $progressbarCurDot),//播放进度条方�?
        player = new Player(data, audio, {
            $byOrder: $byOrder
        }),//媒体文件播放方法
        volumesbar = new Progressbar($volumebar, $volumebarCur, $volumebarCurDot),//音量条方�?
        lyriccontent = null;//歌词方法


    //如果播完了，就自动开始下一�?
    function audioEnded() {
        player.autoSwitchLogic({
            circulatePlay: 'circulate-order',
            randomPlay: 'random-order',
            forwardPlay: 'in-order'
        });
        loadCurMusicInfo(data[player.playIndex]);
    }
    audio.addEventListener('ended', audioEnded);

    //插入播放列表子项
    appendList();
    function appendList() {
        var liArr = [];
        $.each(data, function (i, e) {
            var newMusicLi = '<li>\
                                        <h4 class="musicList-name-detail">'+ e.name + '\
                                            <i class="jump-animate"></i>\
                                        </h4>\
                                        <div class="musicList-info-detail">\
                                            <em class="musicList-singer-detail">'+ e.artist + '</em>\
                                            <div class="musicList-music-details">\
                                                <div class="musicList-ctrl-icon">\
                                                    <i class="smallLi-play-icon play-paused-btn"></i>\
                                                    <i class="musicList-del" title="删除"></i>\
                                                </div>\
                                            </div>\
                                        </div>\
                                      </li >\n';
            liArr.push(newMusicLi);
        });
        $musicListBody.html(liArr.join(''));
        $musicListNum.text(data.length);
    }

    var $smallLiPlayIcon = null,
        $musicList = null;

    updateEle();
    function updateEle() {
        $smallLiPlayIcon = $musicListBody.find('.smallLi-play-icon');//歌词区小图标（播�?/暂停�?
        $musicList = $musicListBody.children();//歌词列表list
    }

    //加载对应资源信息（如专辑海报、背景图、专辑名、歌手名等实时信息）
    loadCurMusicInfo(data[0])
    function loadCurMusicInfo(item) {
        //获取索引
        var index = data.indexOf(item);
        //设置歌曲海报
        $musicPlaybill.attr('src', item.pic);
        $musicPlaybillSmall.css('background-image', 'url("' + item.pic + '")');
        //设置音乐名称
        $musicHeadline.text(item.name);
        $footctrlMusic.text(item.name);
        //设置音乐歌手
        $musicSinger.text(item.artist);
        $footctrlSinger.text(item.artist);

        //设置暂停-播放图标为播放样�?
        $playPauseBtn.removeClass('paused').addClass('played');
        $playPauseBtn.attr('title', '暂停');
        //设置音频url链接地址
        audio.setAttribute('src', item.url);

        //设置音乐总时�?
        // $fixedTime.text(item.totalTime);
        // 加载音频文件以获取其时长
        audio.addEventListener('loadedmetadata', function () {
            // 获取音频文件的总时长（以秒为单位）
            var totalTimeInSeconds = audio.duration;

            // 将秒数转换为分钟和秒格式（例如，将总秒数转换为 mm:ss 格式�?
            var minutes = Math.floor(totalTimeInSeconds / 60);
            var seconds = Math.floor(totalTimeInSeconds % 60);
            var formattedTime = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

            // 设置音乐总时间显�?
            $fixedTime.text(formattedTime);
        });
        //播放音频
        audio.play();
        //加载歌词
        lyriccontent = new Lyric(data[index].lrc, $musicLyric, 'current-display');
        $musicList.eq(index).addClass('boom-animate').siblings().removeClass('boom-animate');//给对应的歌曲列表子项添加正在播放动态效�?
        $smallLiPlayIcon.each(function (i) {
            var $this = $(this);
            if (i === index) {
                $this.removeClass('paused').addClass('played');
                $this.attr('title', '暂停');
            } else {
                $(this).removeClass('played').addClass('paused');
                $this.attr('title', '播放');
            }
        });
    }

    //播放进度条相关事件：点击、拖移，以及播放进度监听事件
    progressRelative();
    function progressRelative() {
        function progressbarCb(currentRatio) {
            if (!globalPlayFlag) return;
            //点击小播放按钮时，先关后歌词区按�?-移动-松开事件后设置的定时�?
            clearTimeout($musicLyric.timeOut);
            //隐藏时间线区
            $lyricTimeLine.css('visibility', 'hidden');
            //声明现在没有进行歌词区移动操作了
            lyriccontent.isMouseDown = false;
            player.setPlayTime(currentRatio);//设置对应的播放进�?
            lyriccontent.shiftLyricBox(player.audio.currentTime, player.audio.duration);//歌词跳到对应的显示位�?
            if (player.audio.paused) {
                player.audio.play();
                player.$playPauseBtn.removeClass('paused').addClass('played');
            }//如果音频本来是暂停的，就让它播放
        }
        progressbar.progressbarClick(progressbarCb);
        progressbar.progressbarDrag(progressbarCb);
        player.timeProgressListener(function (playRatio, curFormatTime) {
            if (!globalPlayFlag) return;
            $curTime.text(curFormatTime);//实时设置currentTime的显示值（00�?00格式�?
            //实时设置进度条宽度、歌词显示位�?
            if (progressbar.isMove) {
                progressbar.setProgressCurSite(playRatio);
                lyriccontent.shiftLyricBox(player.audio.currentTime, player.audio.duration);
            }
        });
    }

    //音量相关
    volumeRelative();
    function volumeRelative() {
        //初始化音量强度为一�?
        var volumesbarW = $volumebar.outerWidth(),
            mediumVal = (1 / 2) * volumesbarW * (volumesbarW - $volumebarCurDot.outerWidth()) / volumesbarW;
        audio.volume = 0.5;
        $volumebarCur.css('width', mediumVal + 'px');
        $volumebarCurDot.css('left', mediumVal + 'px');

        //音量条相关事件：即点击和拖移事件
        var prevVolume = 0;//记录变成静音前的volume�?
        $volumeIcon.on('click', function () {
            var $this = $(this);
            if ($this.hasClass('muted')) {
                $this.removeClass('muted');
                player.audio.volume = prevVolume;
                volumesbar.setProgressCurSite(prevVolume);
            } else {
                prevVolume = player.audio.volume;
                $this.addClass('muted');
                player.audio.volume = 0;
                volumesbar.setProgressCurSite(0);
            }
        });

        function voiceAttrSwitch(currentRatio) {
            if (!globalPlayFlag) return;
            player.setPlayVoice(currentRatio);
            player.audio.volume === 0 ? $volumeIcon.addClass('muted') : $volumeIcon.removeClass('muted');
        }

        volumesbar.progressbarClick(function (currentRatio) {
            voiceAttrSwitch(currentRatio);
        });
        volumesbar.progressbarDrag(null, function (currentRatio) {
            voiceAttrSwitch(currentRatio);
        });

    }

    //暂停与播放事�?
    function playpausedEvent() {
        if (!globalPlayFlag) return;

        var curSmallLiPlayIcon = $smallLiPlayIcon.eq(player.playIndex);
        player.setPlayPaused([
            $playPauseBtn,
            curSmallLiPlayIcon
        ], {
            paused: 'paused',
            played: 'played'
        });
        if (player.audio.paused) {
            curSmallLiPlayIcon.parents('li').find('.jump-animate').css('opacity', 0);
        } else {
            curSmallLiPlayIcon.parents('li').find('.jump-animate').css('opacity', 1);
        }
    }
    //暂停与播放事件————全局暂停/播放按钮点击
    $playPauseBtn.on('click', function () {
        playpausedEvent();
    });

    //音乐切换逻辑
    switchLogic();
    function switchLogic() {
        //点击前后切换按钮以及切换顺序按钮的切换逻辑
        var switchArr = [
            { order: 'in-order', title: '顺序' },
            { order: 'random-order', title: '随机' },
            { order: 'circulate-order', title: '单曲循环' }
        ];

        var orderIndex = 0;
        $byOrder[0].classList.add(switchArr[0].order);
        $byOrder[0].setAttribute('title', switchArr[orderIndex].title);
        $byOrder.on('click', function () {//切换顺序
            this.classList.remove(switchArr[orderIndex].order);
            orderIndex++;
            orderIndex >= switchArr.length && (orderIndex = 0);
            this.classList.add(switchArr[orderIndex].order);
            this.setAttribute('title', switchArr[orderIndex].title);
        });
        $nextMusic.on('click', function () {//下一�?
            if (!globalPlayFlag) return;

            player.clickSwitchLogic({
                randomPlay: 'random-order',
                whichWayPlay: 'next'
            });
            loadCurMusicInfo(data[player.playIndex]);
        });
        $prevMusic.on('click', function () {//上一�?
            if (!globalPlayFlag) return;

            player.clickSwitchLogic({
                randomPlay: 'random-order',
                whichWayPlay: 'prev'
            });
            loadCurMusicInfo(data[player.playIndex]);
        });

        function playPausedTab(target) {
            player.lrcLiClickSwitchEffect(target, playpausedEvent, function () {
                loadCurMusicInfo(data[player.playIndex]);
            });
        }
        //双击播放列表中的曲目时的切换逻辑
        $musicListBody.on('dblclick', 'li', function () {
            playPausedTab($(this));
        });
        //点击歌词列表中的播放/暂停按钮的切换逻辑
        $musicListBody.on('click', '.smallLi-play-icon', function () {
            playPausedTab($(this).parents('li'));
        });

    }

    //歌词区操�?
    lrcMouseMove();
    function lrcMouseMove() {
        var beginY = 0,
            curY = 0,
            moveY = 0;
        //歌词区的鼠标按下-移动-松开事件
        $musicLyric.on('mousedown', function (e) {
            if (!globalPlayFlag) return;

            if (e.button === 0) {
                var curTopVal = parseInt($musicLyric.css('marginTop'));//获取按下鼠标时，歌词区的top�?
                beginY = e.pageY;
                moveY = curTopVal;//设置初始moveY值为该top�?
                lyriccontent.isMouseDown = true;//表明现在正在进行按下-移动-松开事件操作
                clearTimeout($musicLyric.timeOut);
                $lyricTimeLine.css('visibility', 'visible');//让两侧时间线区显�?
                $lyricTimeVal.text(lyriccontent.getAdaptTime(moveY).formatTime);//设置按下鼠标时的坐标对应的歌词所对应的歌曲时�?

                $doc.on('mousemove', function (e) {
                    curY = e.pageY;
                    moveY += curY - beginY;
                    beginY = curY;
                    //限制歌词区移动top值的上限与下�?
                    if (moveY > lyriccontent.allLiTopArr[0]) {
                        moveY = lyriccontent.allLiTopArr[0];
                    } else if (moveY < lyriccontent.allLiTopArr[lyriccontent.allLiTopArr.length - 1]) {
                        moveY = lyriccontent.allLiTopArr[lyriccontent.allLiTopArr.length - 1];
                    }
                    //歌词区移动时，实时设置它的top值，以达到移动效�?
                    $musicLyric.css({
                        'transition': 0 + 's',
                        'marginTop': moveY + 'px'
                    });
                    //歌词区移动时，同时实时设置强调歌词的时间
                    $lyricTimeVal.text(lyriccontent.getAdaptTime(moveY).formatTime);
                });

                $doc.on('mouseup', function () {
                    $doc.off('mousemove');
                    /*建议开启一个定时器之前一定要关掉前一个定时器*/
                    clearTimeout($musicLyric.timeOut);
                    //松开时，开启一个在4秒后只执行一次的定时器。如果在�?4秒期间没点击小播放图标，就让歌词区位置依然随着歌曲播放进度变化而变�?
                    $musicLyric.timeOut = setTimeout(function () {
                        $lyricTimeLine.css('visibility', 'hidden');
                        $musicLyric.css({
                            'transition': '.3s',
                            'marginTop': curTopVal + 'px'
                        })
                        lyriccontent.isMouseDown = false;//松开后四秒后，将取消按下-移动-松开事件判断，表明歌词区现在没有进行移动操作�?
                        $doc.off('mouseup');
                    }, 4000);
                });
            }
        });

        //歌词区小播放按钮点击事件
        $smallPlayIcon.on('click', function () {
            if (!globalPlayFlag) return;

            //点击小播放按钮时，先关后歌词区按�?-移动-松开事件后设置的定时�?
            clearTimeout($musicLyric.timeOut);
            //隐藏时间线区
            $lyricTimeLine.css('visibility', 'hidden');
            //声明现在没有进行歌词区移动操作了
            lyriccontent.isMouseDown = false;
            //再设置要播放的时间进�?
            player.audio.currentTime = lyriccontent.getAdaptTime(moveY).secondsTime;
            if (player.audio.paused) {
                player.audio.play();
                player.$playPauseBtn.removeClass('paused').addClass('played');
            }
        });
    }


    //点击清空列表按钮事件
    function clearAllSongs() {

        globalPlayFlag = false;

        $musicPlaybill.attr('src', '');
        $musicPlaybillSmall.css('background-image', 'url()');
        $footctrlMusic.text('');
        $musicSinger.text('');
        $footctrlSinger.text('');
        $musicAlbum.text('');
        $musicListNum.text('0');//清零音乐列表歌曲显示数量
        $fixedTime.text('00:00');//清零音乐总时�?  
        $curTime.text('00:00');//清零音乐实时时间          
        $playPauseBtn.removeClass('played').addClass('paused');//设置暂停-播放图标为播放样�?
        $playPauseBtn.attr('title', '');
        audio.setAttribute('src', '');//设置音频url链接地址

        $musicListBody.empty();
        $musicLyric.html('笒鬼鬼音乐，让生活充满音乐~~');
        $musicHeadline.html('笒鬼鬼音乐，让生活充满音乐~~');
        $progressbarCur.css({
            'width': 0,
            'left': 0
        });
        $progressbarCurDot.css('left', '-100%');
        data = [];
    }
    $musicListClearAll.on('click', clearAllSongs);

    $musicListBody.on('click', '.musicList-del', function () {
        var $target = $(this).parents('li'),
            dataLastIndex = data.length - 1,
            $curPlayLi = $musicList[player.playIndex],
            playClickIndex = $target.index();
        $target.remove();
        data.splice(playClickIndex, 1);
        updateEle();//更新相关元素
        $musicListNum.text(dataLastIndex);
        if (playClickIndex === player.playIndex) {
            if (playClickIndex >= dataLastIndex) {
                if (dataLastIndex === 0) {
                    clearAllSongs();
                    return;
                }
                player.playIndex = 0;
            }
            loadCurMusicInfo(data[player.playIndex]);
        } else {
            player.playIndex = jQuery.inArray($curPlayLi, $musicList.toArray());
        }
    });

    //键盘事件
    $(document).on('keyup', function (e) {
        //如果是空格键
        if (e.which === 32 || e.keyCode === 32) {
            playpausedEvent();
            //如果是esc�?
        } else if (e.which === 27 || e.keyCode === 27) {
            $playerContainer.toggleClass('slidedown');
        }
    });


    $musicPlaybillSmall.on('click', function () {
        $playerContainer.toggleClass('slidedown');
    });
    $fullscreenBtn.on('click', function () {
        $playerContainer.addClass('slidedown');
    });

}