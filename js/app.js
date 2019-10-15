var Start = {
  init: function() {
    this.$start = $('.start')
    this.$toInitial = this.$start.find('.toInitial')
    this.$toDownLoad = this.$start.find('.toDownLoad')
    this.$toUpLoad = this.$start.find('.toUpLoad')
    this.$form = this.$upFile.find('form')

    this.$progress = $('.progress')
    this.$rightCircle = this.$progress.find('.rightCircle')
    this.$leftCircle = this.$progress.find('.leftCircle')

    this.$downLoadBtn = $('.getResult')
    this.$rate = $('.rate')
    this.$upFile = $('.upload') 
    
    this.bind()
  },
  bind: function() {
    var _this = this

    this.$toInitial.on('click', function() {
      _this.outStart()
    })

    this.$toDownLoad.on('click', function() {
      _this.outStart()
      $('.initial').find('h2')[0].innerText = "题库"
      $('.fileBtn').removeClass('unneed')
      $('.answerBtn').removeClass('unneed')
      $('.range').addClass('unneed')
      $('.startBtn').addClass('unneed')
    })

    this.$toUpLoad.on('click', function() {
      if (!_this.userId) {
        $.ajax({
          url: '/check/id',
          type: 'GET',
          dataType: 'text'
        })
        .done(function(res) {
          _this.userId = res
        })
        .fail(function(err) {
          console.log(err)
        })
      }
      let file = _this.$upFile.find('input[type="file"]')
      file.click()
    })

    this.$form.on('change', '#file', function(e) {
      
      $(this).clone().replaceAll(_this.file = this)
      _this.setForm()
      _this.$start.removeClass('active')
      $('.downLoad').addClass('active')
      _this.currentProgress = 0

      var clock = setInterval(function() {
        $.ajax({
          url: '/check/rate',
          type: 'GET',
          headers: {id: _this.userId}
        })
        .done(function(res) {
          if (res != '100') {
            let rate = parseInt(res)
            if (rate <= 50) {
              _this.$rate[0].innerText = res + '%'
              _this.$rightCircle.css('transform', `rotate(${-135+180*rate/50}deg)`)
              _this.$leftCircle.css('transform', 'rotate(135deg)')
            } else {
              _this.$rate[0].innerText = res + '%'
              _this.$rightCircle.css('transform', 'rotate(45deg)')
              _this.$leftCircle.css('transform', `rotate(${(135+180*rate/100)}deg)`)
            }
          }
          else if (res === '100') {
            $('.downLoad h2')[0].innerText = '点击下载'
            _this.$rate[0].innerText = res + '%'
            _this.$rightCircle.css('transform','rotate(45deg)')
            _this.$leftCircle.css('transform', 'rotate(315deg)')
            _this.$downLoadBtn.addClass('ready')
            var xhr = new XMLHttpRequest()
            xhr.open('GET', '/check/answer', true)
            xhr.responseType = 'blob'
            xhr.setRequestHeader('id', _this.userId)
            xhr.onload = function() {
              if (this.status === 200) {
                var blob = this.response
                _this.a = document.createElement('a')
                _this.a.download = 'Result.txt'
                _this.a.href = window.URL.createObjectURL(blob)
              }
            }
            xhr.send()
            clearInterval(clock)
          }
        })
        .fail(function(err) {
          console.log(err)
        })
      }, 500)
    }) 

    this.$downLoadBtn.on('click', function() {
      _this.a.click()
    })
  },
  outStart: function() {
    this.$start.removeClass('active')
    $('.initial').addClass('active')  
  },
  setForm: function() {
    var _this = this
    var form = document.getElementById('uploadForm')
    console.log(form)
    var formData = new FormData(form)
    formData.append('file', $('#file')[0].files[0])
    $.ajax({
      url: '/check/question',
      type: 'POST',
      data: formData,
      headers: { id: _this.userId },
      processData: false,
      contentType: false
    })
    .done(function(res) {
      console.log(res)
    })
    .fail(function() {
      console.log("error..")
    })
    .always(function() {
      $('#file').replaceWith(_this.file)
    })
  }
}

var Initial = {
  init: function() {
    this.$container = $('.initial')
    this.$practice = $('.practice-ct')
    this.$range = this.$container.find('.range input')  
    this.$startBtn = this.$container.find('.startBtn')
    this.$fileBtn = this.$container.find('.fileBtn')
    this.$answerBtn = this.$container.find('.answerBtn')
    this.answer = []

    this.bind()
  },
  bind: function() {
    var _this = this

    this.$startBtn.on('click', function() {
      let range = _this.$range[0].value

      // _this.showPrac()

      $.ajax({
        url: '/question',
        type: 'GET',
        dataType: 'json',
        data: { range: range }
      })
      .done(function(res) {
        if (res.statusCode === 200) {
          let html = _this.setTopic(res)
          _this.$practice.find('.topic-ct').append(html)
          _this.showPrac()
        }
      })
      .fail(function(err) {
        console.log(err)
      })   
    })

    this.$fileBtn.on('click', function() {  // 点击生成文件按钮下载题目文件
      _this.setRequest('/download/question', "Question")
    })

    this.$answerBtn.on('click', function() {
      _this.setRequest('/download/answer', "Answer")
    })
  },
  setRequest: function(url, fileName) {
    var xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.responseType = 'blob'
      xhr.onload = function() {
        if (this.status === 200) {
          var blob = this.response
          var a = document.createElement('a')
          a.download = `${fileName}.txt`
          a.href = window.URL.createObjectURL(blob)
          a.click()
        }
      }
      xhr.send()
  },
  showPrac: function() {
    this.$container.removeClass('active')
    this.$practice.addClass('active')
    this.$practice.find('.topic-ct div')
                  .eq(0).addClass('active')
  },
  setTopic: function(res) {
    let _this = this
    let html = ""
    res.data.forEach(function(item, idx) {
      _this.answer.push(item.answer)
      html += `
      <div class="topic-wrap">
        <span class="num">${idx+1}/10</span>
        <p class="topic">${item.question}</p>
        <input type="text">
        <span class="answer">正确答案：${item.answer}</span>
      </div>`
    })
    return $(html)
  },
  checkAnswer: function(uAnswer) {
    let _this = this
    let correct = [],
        wrong = []
    uAnswer.forEach(function(item, idx) {
      if (item === _this.answer[idx]) {
        correct.push(idx)
      } else {
        wrong.push(idx)
      }
    })
    return { correct, wrong }
  }
}

var Work = {
  init: function() {
    this.$practice = $('.practice-ct')
    this.$list = this.$practice.find('.topic-list')
    this.$sheet = this.$practice.find('.sheet')
    this.$next = this.$practice.find('.next')
    this.$submit = this.$practice.find('.submit')
    this.idx = 0
    this.bind()
  },
  bind: function() {
    var _this = this

    this.$submit.on('click', function() {
      let uAnswer = []
      let obj = $('.topic-wrap').find('input')
      
      for (let i = 0; i < 10; i++) {
        uAnswer.push(obj[i].value)
      }
      let result = Initial.checkAnswer(uAnswer)
      let correct = result.correct
      let wrong = result.wrong
      _this.showResult(correct, true)
      _this.showResult(wrong, false)
    })

    this.$next.on('click', function() {
      _this.switchTopic(++_this.idx)
    })
    
    this.$list.on('click', 'li', function(e) {
      var li = $(e.currentTarget)
      _this.idx = li[0].innerText - 1
      _this.switchTopic(_this.idx)
    })

    this.$sheet.on('click', function() {
      if (_this.$list.css('display') !== "none") {
        _this.$sheet.find('.switch')[0].innerText = "展示答题卡"
        _this.$sheet.find('.iconfont')
                    .removeClass('icon-up')
                    .addClass('icon-down')
        _this.$list.css('display', 'none')
      }
      else if (_this.$list.css('display') === "none") {
        _this.$sheet.find('.switch')[0].innerText = "隐藏答题卡"
        _this.$sheet.find('.iconfont')
                    .removeClass('icon-down')
                    .addClass('icon-up')
        _this.$list.css('display', 'block')
      }
    })
  },
  switchTopic: function(idx) {
    this.$list.find('li').eq(idx)
              .addClass('active')
              .siblings()
              .removeClass('active')
    $('.topic-wrap').eq(idx)
                    .addClass('active')
                    .siblings()
                    .removeClass('active')
  },
  showResult: function(arr, result) {
    var _this = this

    if (result) {
      arr.forEach(function(idx) {
        _this.$list.find('li').eq(idx)
                  .css('background', '#25bb9b')
      })
    } else {
      arr.forEach(function(idx) {
        _this.$list.find('li').eq(idx)
                  .css({
                    'background': '#ff6547',
                    'color': '#fff'
                  })
        $('.answer').eq(idx).addClass('active')
      })
    }
  }
}

Start.init()
Initial.init()
Work.init()