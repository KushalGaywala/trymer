let alertAudio = new Audio("./audio/mixkit-industry-alarm-tone-2979.wav");

const startButton = document.getElementById("start");
const studyTime = document.getElementById("study-time");
const breakTime = document.getElementById("break-time");
const totalSession = document.getElementById("sessions");
const timerContent = document.getElementById("context");
const studyTimer = document.getElementById("timer");

let minuteCount = 0;
let secondCount = 0;
let sessionCount = 1;
let timerSwitch = 1;
let timerContext = "";
let audioSwitch = 0;

let alertAudioInterval;
let timerInterval;

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

function currContext(timerContent, sessionCount) {
  return timerContent + " " + sessionCount;
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

function playAlertAudio() {
  clearTimerInterval();
  alertAudio.play();
  alertAudio.loop = true;
  callAlertAudioInterval();
}

function funAudioInterval() {
  if (secondCount <= 8) {
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
    startButton.classList.add("is-active");
    if (audioSwitch) {
      alertAudio.play();
      callAlertAudioInterval();
    } else {
      callTimerInterval(event);
    }
  } else if (event.target.value === "Stop") {
    event.target.value = "Start";
    startButton.classList.remove("is-active");
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
  totalSession.value = null;
  timerContent.innerHTML = "Study Timer";
  studyTimer.innerHTML = "00:00";
  startButton.value = "Start";
  startButton.classList.remove("is-active");
  alertAudio.pause();
  clearAlertAudioInterval();
  clearTimerInterval();
}

function funTimerInterval() {
  if (sessionCount <= totalSession.value) {
    if (timerSwitch) {
      if (secondCount < 59 && minuteCount < studyTime.value) {
        timerContext = currContext(
          "Study Timer",
          currSession(sessionCount, totalSession.value)
        );
        ++secondCount;
      } else if (minuteCount < studyTime.value) {
        secondCount = 0;
        ++minuteCount;
      } else {
        secondCount = 0;
        minuteCount = 0;
        timerSwitch = 0;

        playAlertAudio();

        timerContext = currContext(
          "Break Timer",
          currSession(sessionCount, totalSession.value)
        );
        ++sessionCount;
      }
    } else if (!timerSwitch) {
      if (secondCount < 59 && minuteCount < breakTime.value) {
        timerContext = currContext(
          "Break Timer",
          currSession(sessionCount - 1, totalSession.value)
        );
        ++secondCount;
      } else if (minuteCount < breakTime.value) {
        secondCount = 0;
        ++minuteCount;
      } else {
        secondCount = 0;
        minuteCount = 0;
        timerSwitch = 1;

        playAlertAudio();

        timerContext = currContext(
          "Study Timer",
          currSession(sessionCount, totalSession.value)
        );
      }
    }
    timerContent.innerHTML = timerContext;
    studyTimer.innerHTML = newTime(pad(minuteCount), pad(secondCount));
    console.log(newTime(minuteCount, secondCount));
  } else {
    resetFullTimer();
  }
}
