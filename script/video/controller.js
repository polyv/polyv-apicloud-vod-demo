
function PolyvController() {
  this.skin = null;
}

PolyvController.prototype = {

  init: function() {
    var levels = api.pageParam.levels;
    var level = api.pageParam.level;

    this.skin = new PolyvSkin({
      el: $api.dom('.control'), // 控制栏容器
      levels: levels,
      level: level
    });
    this.addEvent();
    this.bindEvent();
  },

  addEvent: function() {
    var that = this;
    api.addEventListener({
      name: 'playerEvent'
    }, function(ret, err) {
      if (err) console.error(err);
      var type = ret.value.type;
      var value = ret.value.val;
      that[type] && that[type](value);
    });
  },

  bindEvent: function() {
    var skin = this.skin;
    var that = this;
    skin.on('INIT', function() {
      // 初始化后设置对应总时长, 清晰度选择，倍速等
    });

    skin.on('PLAY_BTN_CLICKED', function(isToPlay) {
      that.send('PLAY_BTN_CLICKED', isToPlay);
    });

    skin.on('FULL_BTN_CLICKED', function(isToFull) {
      that.send('FULL_BTN_CLICKED', isToFull);
    });

    skin.on('PROGRESS_DRAG_END', function(toSeekTime) {
      that.send('PROGRESS_DRAG_END', toSeekTime);
    });

    skin.on('HD_CHANGED', (level) => {
      that.send('HD_CHANGED', level);
    });

    skin.on('RATE_CHANGED', function(rate) {
      that.send('RATE_CHANGED', rate);
    });

    skin.on('SCREEN_SHOT', function() {
      that.send('SCREEN_SHOT');
    });

    skin.on('LEFT_UP', function() {
      that.send('LEFT_UP');
    });

    skin.on('LEFT_DOWN', function() {
      that.send('LEFT_DOWN');
    });

    skin.on('RIGHT_UP', function() {
      that.send('RIGHT_UP');
    });

    skin.on('RIGHT_DOWN', function() {
      that.send('RIGHT_DOWN');
    });

    skin.on('SEEK_TO', (time) => {
      that.send('SEEK_TO', time);
    });

  },

  play: function() {
    this.changePlayState(true);
  },

  pause: function() {
    this.changePlayState(false);
  },

  timeUpdate: function(time) {
    this.skin && this.skin.timeUpdate(time);
  },

  durationUpdate: function(duration) {
    this.skin && this.skin.durationUpdate(duration);
  },

  changePlayState: function(isToPlay) {
    this.skin && this.skin.changePlayState(isToPlay);
  },

  showLight: function(num) {
    this.skin && this.skin.showLight(num);
  },

  showVolume: function(num) {
    this.skin && this.skin.showVolume(num);
  },

  showSafeArea: function(isShow) {
    this.skin && this.skin.showSafeArea(isShow);
  },

  addGesture: function(isAdd) {
    this.skin && this.skin.addGesture(isAdd);
  },

  send: function(name, value) {
    api.sendEvent({
      name: 'playerEvent',
      extra: {
        type: name,
        val: value
      }
    });
  }
};

function apiready() {
  var controller = new PolyvController();
  controller.init();
}
