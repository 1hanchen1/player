
//进度�?
!function (win, doc, undefined) {

    var Progressbar = function ($progressbar, $progressbarCur, $progressbarCurDot) {

        this.progressbar = $progressbar;//进度（音量条
        this.progressbarCur = $progressbarCur;//实时进度（音量）�?
        this.progressbarCurDot = $progressbarCurDot;//进度条上的点
        this.curDotWidth = this.progressbarCurDot.outerWidth();
        this.barOffsetWidth = this.progressbar.outerWidth();//进度条的宽度
        this.barOffsetLeft = this.progressbar.offset().left;//进度条的offsetLeft�?
        this.isMove = true;//判断是否正在移动progressbar
    }

    Progressbar.prototype = {

        constructor: Progressbar,

        //点击进度条触发的实践
        progressbarClick: function (callBack) {
            var _this = this;
            this.progressbar.on('click', function (e) {
                var resetRatio = (e.pageX - _this.barOffsetLeft) / _this.barOffsetWidth;
                _this.setProgressCurSite(resetRatio);
                callBack && callBack(resetRatio);
            });

        },

        //设置实时进度（音量）条位�?
        setProgressCurSite: function (value) {
            var barOffsetWidth = this.barOffsetWidth,
                tarVal = value * barOffsetWidth * (barOffsetWidth - this.curDotWidth) / barOffsetWidth;//自适应比例�?
            this.progressbarCur.css('width', tarVal + 'px');
            this.progressbarCurDot.css('left', tarVal + 'px');
        },

        //进度条拖动事�?
        progressbarDrag: function (callBack, callBackVoice) {
            var _this = this,
                $doc = $('html,body');
            this.progressbar.on('mousedown', function (e) {
                //判读如果此时可以移动并且按下的死鼠标左键才可执行
                if (_this.isMove && e.button === 0) {
                    _this.isMove = false;
                    var tarPointRatio = (e.pageX - _this.barOffsetLeft) / _this.barOffsetWidth;
                    _this.setProgressCurSite(tarPointRatio);
                    $doc.on('mousemove', function (e) {
                        tarPointRatio = (e.pageX - _this.barOffsetLeft) / _this.barOffsetWidth;
                        if (tarPointRatio < 0) {
                            tarPointRatio = 0;
                        }
                        if (tarPointRatio > 1) {
                            tarPointRatio = 1;
                        }
                        //设置实时进度（音量）的位�?
                        _this.setProgressCurSite(tarPointRatio);
                        //调音�?
                        callBackVoice && callBackVoice(tarPointRatio);
                    });

                    $doc.on('mouseup', function () {
                        $doc.off('mousemove');
                        callBack && callBack(tarPointRatio);
                        _this.isMove = true;
                        $doc.off('mouseup');
                    });
                }

            })


        }

    }

    window.Progressbar = Progressbar;

}(window, document);


//播放
!function (win, doc, undefined) {

    var Player = function (data, audio, params) {

        this.audio = audio;//音乐对象
        this.data = data;
        this.$byOrder = params.$byOrder;//播放顺序按钮
        this.playIndex = 0;//当前播放的歌词的索引
        this.clickJumpPlay = false;//判断是否有进行跳跃播�?

    }

    Player.prototype = {

        constructor: Player,

        //格式化实时显示的时间
        formatTime: function (currentTime, duration) {

            var curMinus = parseInt(currentTime / 60),
                curSecond = parseInt(currentTime - curMinus * 60),
                fixedMinus = parseInt(duration / 60),
                fixedSecond = parseInt(duration - fixedMinus * 60);

            curMinus < 10 && (curMinus = '0' + curMinus);
            curSecond < 10 && (curSecond = '0' + curSecond);
            fixedMinus < 10 && (fixedMinus = '0' + fixedMinus);
            fixedSecond < 10 && (fixedSecond = '0' + fixedSecond);

            curFormatTime = curMinus + ':' + curSecond;
            fixedFormatTime = fixedMinus + ':' + fixedSecond;
            return curFormatTime;

        },

        //歌曲播放进度监听
        timeProgressListener: function (callBack) {
            var _this = this;
            _this.audio.addEventListener('timeupdate', function () {
                var playRatio = this.currentTime / this.duration,//当前播放进度的比�?
                    timeStr = _this.formatTime(this.currentTime, this.duration);//标准化当前播放进度时间（00�?00形式�?
                callBack(playRatio, timeStr);
            }, false);
        },

        //暂停或播放的转换
        setPlayPaused: function (arr, option) {
            if (this.audio.paused) {
                arr.forEach(function (e) {
                    e.removeClass(option.paused).addClass(option.played);
                    e.attr('title', '暂停');
                });
                this.audio.play();
            } else {
                arr.forEach(function (e) {
                    e.removeClass(option.played).addClass(option.paused);
                    e.attr('title', '播放');
                });
                this.audio.pause();
            }
        },

        //设置实时音量——volume
        setPlayVoice: function (value) {
            this.audio.volume = value * 1;
        },

        //设置实时进度时间——currentTime
        setPlayTime: function (value) {
            var curTime = value * this.audio.duration;
            this.audio.currentTime = curTime;

        },

        //播放完时，自动切换顺序逻辑
        autoSwitchLogic: function (option) {
            var dataLen = this.data.length;
            switch (true) {
                case this.$byOrder.hasClass(option.forwardPlay):
                    this.playIndex++;
                    this.playIndex >= dataLen && (this.playIndex = 0);
                    break;
                case this.$byOrder.hasClass(option.randomPlay):
                    var randomNum = Math.round(Math.random() * (dataLen - 1)),
                        playIndex = this.playIndex;
                    this.playIndex = playIndex == randomNum ? ++playIndex : randomNum;
                    this.playIndex >= dataLen && (this.playIndex = 0);
                    break;
                case this.$byOrder.hasClass(option.circulate):
                    break;
            }

        },

        //单击前一首或下一首的切换效果
        clickSwitchLogic: function (option) {
            var dataLen = this.data.length;
            switch (true) {
                case this.$byOrder.hasClass(option.randomPlay):
                    var randomNum = Math.round(Math.random() * (dataLen - 1)),
                        playIndex = this.playIndex;
                    this.playIndex = playIndex == randomNum ? ++playIndex : randomNum;
                    this.playIndex >= dataLen && (this.playIndex = 0);
                    break;
                case option.whichWayPlay === 'next':
                    this.playIndex++;
                    this.playIndex >= dataLen && (this.playIndex = 0);
                    break;
                case option.whichWayPlay === 'prev':
                    this.playIndex--;
                    this.playIndex < 0 && (this.playIndex = dataLen - 1);
                    break;
            }
        },

        //双击播放列表子项切换效果：实现切换音乐、暂�?/播放当前音乐
        lrcLiClickSwitchEffect: function (curItem, setPlayPaused, tabNext) {
            var curClickIndex = curItem.index();
            if (this.playIndex === curClickIndex) {
                setPlayPaused();
            } else {
                this.playIndex = curClickIndex;
                tabNext();
            }
        }

    }

    window.Player = Player;

}(window, document);


//歌词

!function (win, doc, undefined) {

    var Lyric = function (lyricFile, lyricBox, curLiClass) {
        this.lyricFile = lyricFile;//歌词数据
        this.lyricBox = lyricBox;//歌词盒子容器
        this.curLiClass = curLiClass;//正要显示的歌词的样式
        this.isMouseDown = false;//判断鼠标时候在拖动
        this.limitValue = -1;//用于进行判断当前时间有没有到下一句播放的时间(初始值为-1，表示为播放之前)
        this.allLiTopArr = [];//用于存储每一行歌词正在显示时的top值的数组
        this.allLiHeightArr = [];//用于存储每一行歌词的高度
        this.getLyricList();
    }

    Lyric.prototype = {

        constructor: Lyric,
        //用ajax加载好歌词文件成功后，进行的初始化歌词操�?
        init: function (lyricData) {
            this.lyricStr = this.parseLyricInfo(lyricData);//将歌词文件内容解析为要显示的歌词内容
            this.appendLyric(this.lyricStr.str);//将解析好的歌词内容插入到内容区中
            this.allLyricLi = this.lyricBox.children();//获取所有的歌词li
            this.initTopVal = (this.lyricBox.parent().outerHeight() - this.allLyricLi.eq(0).outerHeight()) / 2;//初始化top�?
            this.lyricBox.css('top', this.initTopVal + 'px');
            this.getLyricLiTop(this.allLyricLi);
            this.initLyricBoxSite();//初始化歌词区位置
        },

        //获取歌词展示区域的每一行top值的数组
        getLyricLiTop: function (allLyricLi) {
            var _this = this,
                flagVal = 0;
            _this.allLiTopArr.push(flagVal);
            allLyricLi.each(function (i, e) {
                var $eHeight = $(e).outerHeight();
                flagVal -= $eHeight;
                _this.allLiTopArr.push(flagVal);
                _this.allLiHeightArr.push($eHeight);
            });
            _this.allLiTopArr = _this.allLiTopArr.slice(0, _this.allLiTopArr.length - 1);
        },
        //获取歌曲信息txt文件
        getLyricList: function () {
            var _this = this;
            $.ajax({

                url: _this.lyricFile,

                type: 'get',

                dataType: 'text',

                success: function (lyricData) {

                    _this.init(lyricData);

                },
                error: function (e) {
                    console.log(e);
                }


            })

        },
        //解析(格式�?)歌词相关信息：歌词和时间(转换成秒�?)
        parseLyricInfo: function (lyricData) {
            var _this = this,
                lyricReg = /\[(\d*:\d*.\d*)\]/,//歌词时间正则验证
                lyricArr = lyricData.split('\n');//歌词内容分行

            var curLyricArr = [], curTimeArr = [], listHtml = '';
            $.each(lyricArr, function (i, e) {
                if (lyricReg.test(e)) {
                    //将时间数据和歌词数据分离
                    var separate = e.split(']'),
                        separateBefore = separate[0].slice(1),//时间
                        separateAfter = separate[1];//歌词
                    //筛选掉内容为空的歌词部�?
                    if (separateAfter !== undefined && Number(separateAfter) !== 0) {
                        listHtml = '<li>' + separateAfter + '</li>\n';
                        curLyricArr.push(listHtml);
                        curTimeArr.push(_this.parseLyricTime(separateBefore));
                    }
                }
            });
            //返回歌词和对应时间数�?
            return { 'str': curLyricArr, 'time': curTimeArr };
        },
        //解析(格式�?)歌词时间(秒为单位)
        parseLyricTime: function (timeNode) {
            var formatTimeNode = timeNode.split(':'),
                formatMinute = Number(formatTimeNode[0]) * 60,
                formatSecond = parseFloat(Number(formatTimeNode[1]).toFixed(1)),
                activeTime = formatMinute + formatSecond;
            return activeTime;//歌词对应的实时时间（单位为秒�?
        },
        //插入所需的歌�?
        appendLyric: function (listHtml) {
            this.lyricBox.html(listHtml.join(''));
        },
        //每次换歌时，就初始化歌曲区的位置(设top值为0)
        initLyricBoxSite: function () {
            this.lyricBox.css({
                'marginTop': 0
            });
        },
        //歌词区动态移动效�?(随着播放进度、进度条点击或拖动操作自适应移动)
        shiftLyricBox: function (curTime, upperLimt) {
            //这里做歌词内容判断是为了解决歌词数据没有解析好的问题
            if (this.lyricStr !== undefined) {
                curTime = parseFloat(curTime.toFixed(1));
                var _this = this,
                    // nextTime = 0,
                    lrcTimeStr = jQuery.extend(true, [], _this.lyricStr.time),//拷贝歌词对应的时间数（数组）
                    lrcTimeStrLen = lrcTimeStr.length - 1;
                lrcTimeStr.push(upperLimt);//nextTime上限为歌曲的duration（结束时间）
                //得出currentTime所在的时间区间内的index索引（ps：不想用findIndex，毕竟不兼容IE�?
                var curTimeVal = lrcTimeStr.filter(function (e, i) {
                    if (i > lrcTimeStrLen) return;
                    return curTime >= e && curTime < lrcTimeStr[i + 1];
                })[0];

                //进行limitValue判断的原因是避免其持续触发造成不必要的资源浪费问题（以此保证一句歌词内只执行一次）
                //另外，还需要歌词区没有鼠标按下-移动-松开事件
                if (_this.limitValue != curTimeVal && !_this.isMouseDown && curTimeVal !== undefined) {
                    _this.limitValue = curTimeVal;
                    var curIndex = lrcTimeStr.indexOf(curTimeVal);
                    _this.allLyricLi.eq(curIndex).addClass(_this.curLiClass).siblings().removeClass(_this.curLiClass);
                    _this.lyricBox.css({
                        'transition': '.3s',
                        'marginTop': _this.allLiTopArr[curIndex] + 'px'
                    });
                }

                // var curIndex = lrcTimeStr.findIndex(function (e, i) {
                //     return curTime >= e && curTime < lrcTimeStr[i + 1];
                // });

                // $.each(lrcTimeStr, function (i, e) {
                //     if(i > lrcTimeStrLen) return;
                //     nextTime = lrcTimeStr[i + 1];
                //     //如果实时时间在该歌词要显示的时间段内，就设置相应的显示效果（该段歌词强调效果�?
                //     //另外，还需要歌词区没有鼠标按下-移动-松开事件
                //     if (curTime >= e && curTime < nextTime && !_this.isMouseDown) {
                //         //进行判断的原因是避免其持续触发造成不必要的资源浪费问题（以此保证一句歌词内只执行一次）
                //         if (_this.limitValue != e) {
                //             _this.limitValue = e;
                //              _this.allLyricLi.eq(i).addClass(_this.curLiClass).siblings().removeClass(_this.curLiClass);
                //             _this.lyricBox.animate({
                //                 'marginTop':_this.allLiTopArr[i] + 'px'
                //             },100);
                //         }
                //     }
                // });
            }
        },

        //获取当前显示的歌词的li的index�?
        getCurLiIndex: function (initVal, tarArr) {
            var tarArrLen = tarArr.length - 1,
                resetTarArr = jQuery.extend(true, [], tarArr);
            resetTarArr.push(tarArr[tarArrLen] - 1);
            for (var item = 0; item <= tarArrLen; item++) {
                if (initVal <= resetTarArr[item] && initVal > resetTarArr[item] - this.allLiHeightArr[item]) {
                    return item;
                }
            }
        },

        //歌词区在按下-移动-松开事件下，实时获取歌词的对应时�?
        getAdaptTime: function (moveY) {
            var targetIndex = this.getCurLiIndex(moveY, this.allLiTopArr),
                activeLrcTime = this.lyricStr.time[targetIndex],
                activeLrcMin = Math.floor(activeLrcTime / 60),
                activeLrcSecond = Math.round(activeLrcTime % 60);
            activeLrcMin < 10 && (activeLrcMin = '0' + activeLrcMin);
            activeLrcSecond < 10 && (activeLrcSecond = '0' + activeLrcSecond);
            return { 'secondsTime': activeLrcTime, 'formatTime': activeLrcMin + ':' + activeLrcSecond };
        }
    }

    window.Lyric = Lyric;

}(window, document);