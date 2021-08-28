const timer = document.getElementById("time");
const todate = document.getElementById("date");
const button = document.getElementById("button");
const studyTime = document.getElementById("study-time");
const breakTime = document.getElementById("break-time");
const session = document.getElementById("sessions");
const context = document.getElementById("context");
const sTimer = document.getElementById("timer");

// watch START
let watchInterval = setInterval(function () {
  let today = new Date();
  let month = today.getMonth() + 1;
  let day = today.getDay();
  let date = today.getDate();
  let hour = today.getHours();
  let minute = today.getMinutes();
  let seconds = today.getSeconds();

  timer.innerHTML = pad(hour) + ":" + pad(minute) + ":" + pad(seconds);
  todate.innerHTML = getDay(day) + ", " + getMonth(month) + " " + pad(date);
});
// watch END

let min = 0;
let sec = 0;
let sess = 1;
let swtch = 1;

let timerInterval;
button.addEventListener("click", function () {
  if (button.value === "Start") {
    button.value = "Stop";
    timerInterval = setInterval(funInterval, 1000);
  } else if (button.value === "Stop") {
    button.value = "Start";
    clearInterval(timerInterval);
  }
});

function funInterval() {
  if (sess <= session.value) {
    if (swtch) {
      context.innerHTML = "Study Timer" + " ";
      context.innerHTML += currSession(sess, session.value);
      if (sec < 59 && min < studyTime.value) {
        ++sec;
      } else if (min < studyTime.value) {
        sec = 0;
        ++min;
      } else {
        sec = 0;
        min = 0;
        swtch = 0;
        if (sess == session.value) {
          ++sess;
        }
      }
    } else if (!swtch) {
      context.innerHTML = "Break Timer" + " ";
      context.innerHTML += currSession(sess, session.value);
      if (sec < 59 && min < breakTime.value) {
        ++sec;
      } else if (min < breakTime.value) {
        sec = 0;
        ++min;
      } else {
        sec = 0;
        min = 0;
        swtch = 1;
        ++sess;
      }
    }
    sTimer.innerHTML = newTime(pad(min), pad(sec));
    console.log(newTime(min, sec));
  } else {
    context.innerHTML = "Study Timer";
  }
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
