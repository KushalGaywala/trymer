let alertAudio = new Audio("./audio/mixkit-industry-alarm-tone-2979.wav");

const startButton = document.getElementById("start");
const studyTime = document.getElementById("study-time");
const breakTime = document.getElementById("break-time");
const totalsession = document.getElementById("sessions");
const timercontext = document.getElementById("context");
const studyTimer = document.getElementById("timer");

let minuteCount = 0;
let secondCount = 0;
let sessionCount = 1;
let timerSwitch = 1;
let timerContext = "";
let audioSwitch = 0;

let alertAudioInterval;
let timerInterval;

// watch START
let watchInterval = setInterval(function (event) {
  let today = new Date();
  let month = today.getMonth() + 1;
  let day = today.getDay();
  let date = today.getDate();
  let hour = today.getHours();
  let minute = today.getMinutes();
  let seconds = today.getSeconds();

  document.getElementById("time").innerHTML =
    pad(hour) + ":" + pad(minute) + ":" + pad(seconds);
  document.getElementById("date").innerHTML =
    getDay(day) + ", " + getMonth(month) + " " + pad(date);
});
// watch END

startButton.addEventListener("click", function (event) {
  if (event.target.value === "Start") {
    event.target.value = "Stop";
    if (audioSwitch) {
      alertAudio.play();
      callAlertAudioInterval();
    } else {
      callTimerInterval(event);
    }
  } else if (event.target.value === "Stop") {
    event.target.value = "Start";
    alertAudio.pause();
    clearTimerInterval();
    clearAlertAudioInterval();
  }
});

document.getElementById("reset").addEventListener("click", function (event) {
  if (event.target.value === "Reset") {
    resetFullTimer();
  }
});

function resetFullTimer() {
  minuteCount = 0;
  secondCount = 0;
  sessionCount = 1;
  timerSwitch = 1;
  audioSwitch = 0;
  studyTime.value = null;
  breakTime.value = null;
  totalsession.value = null;
  timerContext.innerHTML = "Study Timer";
  studyTimer.innerHTML = newTime(pad(min), pad(sec));
  startButton.value = "Start";
  alertAudio.pause();
  clearAlertAudioInterval();
  clearTimerInterval();
}

function funTimerInterval() {
  if (sessionCount <= totalsession.value) {
    if (timerSwitch) {
      timerContext = currContext(
        "Study Timer",
        currSession(sessionCount, totalsession.value)
      );
      if (secondCount < 59 && minuteCount < studyTime.value) {
        ++secondCount;
      } else if (minuteCount < studyTime.value) {
        secondCount = 0;
        ++minuteCount;
      } else {
        secondCount = 0;
        minuteCount = 0;
        timerSwitch = 0;
        ++sessionCount;
        clearTimerInterval();
        alertAudio.play();
        alertAudio.loop = true;
        callAlertAudioInterval();
        timerContext = currContext(
          "Break Timer",
          currSession(sessionCount - 1, totalsession.value)
        );
      }
    } else if (!timerSwitch) {
      timerContext = currContext(
        "Break Timer",
        currSession(sessionCount - 1, totalsession.value)
      );
      if (secondCount < 59 && minuteCount < breakTime.value) {
        ++secondCount;
      } else if (minuteCount < breakTime.value) {
        secondCount = 0;
        ++minuteCount;
      } else {
        secondCount = 0;
        minuteCount = 0;
        timerSwitch = 1;
        timerContext = currContext(
          "Study Timer",
          currSession(sessionCount, totalsession.value)
        );
      }
    }
    timercontext.innerHTML = timerContext;
    studyTimer.innerHTML = newTime(pad(minuteCount), pad(secondCount));
    console.log(newTime(minuteCount, secondCount));
  } else {
    resetFullTimer();
  }
}

function funAudioInterval() {
  if (secondCount < 7) {
    audioSwitch = 1;
    console.log("musicsec: " + secondCount);
    ++secondCount;
  } else {
    console.log("musicsecpause: " + secondCount);
    audioSwitch = 0;
    alertAudio.pause();
    clearAlertAudioInterval();
    secondCount = 0;
    callTimerInterval();
  }
}

function callTimerInterval() {
  timerInterval = setInterval(function () {
    funTimerInterval();
  }, 1000);
}

function callAlertAudioInterval() {
  alertAudioInterval = setInterval(function () {
    funAudioInterval();
  }, 1000);
}

function clearAlertAudioInterval() {
  clearInterval(alertAudioInterval);
}

function clearTimerInterval() {
  clearInterval(timerInterval);
}

function currContext(timercontext, sessionCount) {
  return timercontext + " " + sessionCount;
}

function currSession(cur, total) {
  return cur + "/" + total;
}

function newTime(minute, second) {
  return minute + ":" + second;
}

function pad(digit) {
  return digit < 10 ? "0" + digit : digit;
}

function getDay(day) {
  switch (day) {
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
    case 0:
      return "Sunday";
    default:
      return "No Day";
  }
}

function getMonth(month) {
  switch (month) {
    case 1:
      return "January";
    case 2:
      return "Febuarary";
    case 3:
      return "March";
    case 4:
      return "April";
    case 5:
      return "May";
    case 6:
      return "June";
    case 7:
      return "July";
    case 8:
      return "August";
    case 9:
      return "September";
    case 10:
      return "October";
    case 11:
      return "November";
    case 12:
      return "December";
    default:
      return "No Month";
  }
}
