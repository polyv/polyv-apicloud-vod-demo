function VideoFrame(options) {
  this.polyvVideo = options.polyvVideo;
  this.polyvVideoInfo = options.polyvVideoInfo;
  this.videoHeight = options.videoHeight;
  this.levels = null;
  this.level = 0;
  this.vid = '6a83c6abfc7724f65dd66f2ce35ba804_6';
}

VideoFrame.prototype = {
  init: function () {
    this.initDom();
    this.getInfo();
    this.addEvent();
    this.bindEvent();
  },

  initDom: function () {
    const domSelect = {
      $playBtn: '.play-btn',
      $configWrap: '.config-wrap',
      $changeVidWrap: '.change-vid-wrap',
      $changeVidBtn: '.change-btn',
      $changeVidIpt: '.change-vid',
      $pathIpt: '.local-path',
      $vidIpt: '.video-vid',
      $autoPlaySwitch: '.auto-check',
      $fixedSwitch: '.fixed-check',
      $seekTypeSwitch: '.seek-type-check',
      $disableScreenCAPSwitch: '.cap-check',
      $dropdownMenu: '.dropdown-menu',
      $hdInfo: '.hd-info'
    };

    for (var key in domSelect) {
      this[key] = document.querySelector(domSelect[key]);
    }
  },

  getInfo: function () {
    this.getLevels();
  },

  addEvent: function () {
    var that = this;
    api.addEventListener({
      name: 'playerEvent'
    }, function (ret, err) {
      if (err) console.error(err);
      var type = ret.value.type;
      var value = ret.value.val;
      switch (type) {
        case 'PLAY_BTN_CLICKED':
          value ? that.play() : that.pause();
          break;
        case 'FULL_BTN_CLICKED':
          value ? that.fullScreen() : that.cancelFullScreen();
          break;
        case 'PROGRESS_DRAG_END':
          that.seekTo(value);
          break;
        case 'HD_CHANGED':
          that.changeLevel(value);
          break;
        case 'RATE_CHANGED':
          that.setSpeed(value);
          break;
        case 'SCREEN_SHOT':
          that.snapshot();
          break;
        case 'LEFT_UP':
          that.setBrightness(2);
          break;
        case 'LEFT_DOWN':
          that.setBrightness(-2);
          break;
        case 'RIGHT_UP':
          that.setVolume(0.02);
          break;
        case 'RIGHT_DOWN':
          that.setVolume(-0.02);
          break;
        case 'SEEK_TO':
          that.seekTo(value);
          break;
      }
    });
  },

  bindEvent: function () {
    var that = this;
    that.$playBtn.addEventListener('click', function () {
      that.newPlayer();
      that.$configWrap.className += ' hide';
      that.$changeVidWrap.className += ' show';
    });

    that.$changeVidBtn.addEventListener('click', function() {
      that.polyvVideo.setVid({
        vid: that.$changeVidIpt.value
      });
    });

    that.$dropdownMenu.addEventListener('click', function(e) {
      that.level = e.target.tabIndex;
      that.$hdInfo.textContent = e.target.textContent;
    });
  },

  newPlayer: function (forceVid) {
    var that = this;
    var params = {
      rect: that.getRect(),
      level: that.level,
      autoPlay: that.$autoPlaySwitch.checked ? true : false,
      fixed: that.$fixedSwitch.checked ? true : false,
      seekType: that.$seekTypeSwitch.checked ? 1 : 0,
      disableScreenCAP: that.$disableScreenCAPSwitch.checked ? true : false,
      vid: forceVid || that.$vidIpt.value,
      path: that.$pathIpt.value
    };

    this.polyvVideo.open(params, function (ret, err) {
      if (err) console.log(err);
      that.send(ret.eventType);

      if (ret.eventType === 'show') {
        that.initController();
        setInterval(function () {
          that.updateProgress();
        }, 1e3);
      }

      that.send('addGesture', true);
    });
  },

  getLevels: function () {
    var that = this;
    this.polyvVideoInfo.getLevelNum({
      vid: that.vid
    }, function (ret, err) {
      if (err) {
        return;
      }
      that.levels = ret.levelNum;
    });
  },

  initController: function (isLandscape) {
    var that = this;
    var _h = api.frameWidth;
    api.openFrame({
      name: 'controller',
      url: './video/controller.html',
      rect: isLandscape ? {
        x:  0,
        y: 0,
        w: "auto",
        h: _h
      }: that.getRect(),
      pageParam: {
        levels: that.levels,
        level: that.level
      },
      bgColor: 'rgba(0, 0, 0, 0)',
      bounces: false,
      slidBackEnabled: true,
      vScrollBarEnabled: false,
      hScrollBarEnabled: false,
    });
    that.bringFrameToFront('controller');
  },

  updateProgress() {
    var that = this;
    this.polyvVideo.isPlaying(function (ret, err) {
      if (ret.isPlaying) {
        that.send('changePlayState', true);

        that.polyvVideo.getCurrentPosition(function (ret, err) {
          var currentPosition = ret.currentPosition;
          that.send('timeUpdate', currentPosition);
        });

        that.polyvVideo.getDuration(function (ret, err) {
          var duration = ret.duration;
          that.send('durationUpdate', duration);
        });
      } else {
        that.send('changePlayState', false);
      }
    });
  },

  play: function () {
    this.polyvVideo.start();
  },

  pause: function () {
    this.polyvVideo.pause();
  },

  seekTo: function (time) {
    this.polyvVideo.seekTo({
      seconds: time
    });
  },

  setSpeed: function (speed) {
    this.polyvVideo.setSpeed({
      speed: speed
    });
    this.setFrameRect(100);
  },

  changeLevel: function (level) {
    this.polyvVideo.changeLevel({
      level: level
    });
  },

  fullScreen: function () {
    var that = this;
    this.switchLandscape(true);
    this.polyvVideo.fullScreen(function (ret, err) {
      that.initController(true);
      that.send('showSafeArea', true);
    });
  },

  cancelFullScreen: function () {
    var that = this;
    this.switchLandscape(false);
    this.polyvVideo.cancelFullScreen(function (ret, err) {
      that.initController();
      that.send('showSafeArea', false);
    });
  },

  snapshot: function () {
    this.polyvVideo.snapshot();
  },

  setBrightness: function (delta) {
    var that = this;
    var polyvVideo = this.polyvVideo;
    polyvVideo.getBrightness(function (ret, err) {
      var brightness = Number(ret.brightness) + delta;
      // console.log("brightness " + brightness);
      polyvVideo.setBrightness({
        brightness: brightness
      });
      that.send('showLight', brightness);
    });
  },

  setVolume: function (delata) {
    var that = this;
    var polyvVideo = this.polyvVideo;
    polyvVideo.getVolume(function (ret, err) {
      var volume = Number(ret.volume) + Number(delata);
      // console.log("volume " + volume);
      polyvVideo.setVolume({
        volume: volume
      });
      that.send('showVolume', volume);
    });
  },

  send: function (name, value) {
    api.sendEvent({
      name: 'playerEvent',
      extra: {
        type: name,
        val: value
      }
    });
  },

  bringFrameToFront: function (name) {
    api.bringFrameToFront({
      from: name,
    });
  },

  getRect(forHeight) {
    return {
      x: 0,
      y: 84,
      w: 'auto',
      h: forHeight ? forHeight : this.videoHeight
    }
  },

  switchLandscape: function (isSwitch) {
    api.setScreenOrientation({
      orientation: isSwitch ? 'landscape_left' : 'portrait_up'
    });
  },

  setFrameRect: function (height) {
    var that = this;
    api.setFrameAttr({
      name: 'controller'
    }, {
      rect: that.getRect(height)
    });
  }

};

function apiready() {
  var polyvVideo, polyvVideoInfo, videoFrame;
  var videoHeight = api.winWidth * 0.5625;

  // 获取polyvVideoModule模块
  polyvVideo = api.require('polyvVideoModule');
  polyvVideoInfo = api.require('polyvVideoInfoModule');

  // 页面播放配置
  videoFrame = new VideoFrame({
    polyvVideo: polyvVideo,
    polyvVideoInfo: polyvVideoInfo,
    videoHeight: videoHeight
  });
  videoFrame.init();
}
