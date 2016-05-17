$("path").click(function() {
  if (countryNumbers[$(this).attr("countryId")]) {
    alert($(this).attr("countryId") + ": " + countryNumbers[$(this).attr("countryId")]);
  } else {
    alert($(this).attr("countryId") + ": 0");
  }
});
