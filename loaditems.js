i = 0
worksdiv = document.getElementById("works")
fetch(
    "https://opensheet.elk.sh/1nzp20-DijrRnfg5CG-pafIiw5pFm_fzl6t5MGoR0XOY/works"
  )
    .then((res) => res.json())
    .then((data) => {
      data.forEach((row) => {
          worksdiv.innerHTML += `<div><p>${data[i].title}</p></div>`
          i++
      });
    });