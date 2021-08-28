const timer = document.getElementById("timer");
const todate = document.getElementById("date");

setInterval(function () {
  let today = new Date();
  let month = today.getMonth() + 1;
  let day = today.getDay();
  let date = today.getDate();
  let hour = today.getHours();
  let minute = today.getMinutes();
  let seconds = today.getSeconds();

  timer.innerHTML = pad(hour) + ":" + pad(minute) + ":" + pad(seconds);
  todate.innerHTML = getDay(day) + ", " + getMonth(month) + " " + pad(date);
}, 1000);

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
    case 7:
      return "Sunday";
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
