let currentPageSize = 3;
let totalPages = 0;
let currentPage = 0;
let currentPlayers = [];

let editMode = false;
let editRow = null;

const Races = {
    HUMAN: "HUMAN",
    DWARF: "DWARF",
    ELF: "ELF",
    GIANT: "GIANT",
    ORC: "ORC",
    TROLL: "TROLL",
    HOBBIT: "HOBBIT"
}

const Professions = {
    WARRIOR: "WARRIOR",
    ROGUE: "WARRIOR",
    SORCERER: "SORCERER",
    CLERIC: "CLERIC",
    PALADIN: "PALADIN",
    NAZGUL: "NAZGUL",
    WARLOCK: "WARLOCK",
    DRUID: "DRUID"
}

const Columns = {
    id: "id",
    Name: "name",
    Title: "title",
    Race: "race",
    Profession: "profession",
    Level: "level",
    Birthday: "birthday",
    Banned: "banned",
    Edit: "edit",
    Delete: "delete"
}

const ColumnIndex = {
    1: Columns.Name,
    2: Columns.Title,
    3: Columns.Race,
    4: Columns.Profession,
    5: Columns.Level,
    6: Columns.Birthday,
    7: Columns.Banned,
}

const fieldConfig = {
    [Columns.Name]: {type: "input", id: "name-input", dataType: "string", minLength: 1, maxLength: 12},
    [Columns.Title]: {type: "input", id: "title-input", dataType: "string", minLength: 1, maxLength: 30},
    [Columns.Race]: {type: "select", id: "race-select", options: Object.values(Races)},
    [Columns.Profession]: {type: "select", id: "profession-select", options: Object.values(Professions)},
    [Columns.Level]: {type: "input", id: "level-input", dataType: "number", min: 0, max: 100},
    [Columns.Birthday]: {type: "input", id: "birth-input", dataType: "date"},
    [Columns.Banned]: {type: "select", id: "banned-select", options: [false, true]}
}

removeChildren = (parent) => {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

initCountPerPageSelect = () => {
    const container = document.getElementById("count-per-page");

    const label = document.createElement("label");
    label.for = "count-per-page-select";
    label.textContent = "Count per page:";

    const select = useSelect({
        id: "count-per-page-select",
        options: [...Array(18).keys()].map(i => i + 3)
    })

    select.onchange = async (v) => {
        currentPageSize = v.target.value;
        currentPage = 0;
        await renderPages();
        await fetchPlayers();
        await renderPlayers();
    }

    container.append(label, select);
}

renderPages = async () => {
    const paginationNode = document.getElementById("pagination");

    removeChildren(paginationNode);

    for (let i = 0; i < totalPages / currentPageSize; i++) {
        const link = document.createElement("span");

        if (i === currentPage) {
            link.classList.add('active')
        }

        link.textContent = i + 1;
        link.onclick = async (v) => {
            currentPage = v.target.textContent - 1;
            await fetchPlayers();
            await renderPlayers();
            await renderPages();
        }
        paginationNode.appendChild(link);
    }
}

initPages = async () => {
    await fetchPages();
    await renderPages();
}

renderPlayers = async () => {
    const table = document.getElementById("table");
    const header = document.getElementById("header");

    removeChildren(table);

    table.appendChild(header);

    currentPlayers.forEach((player, i) => {
            const row = document.createElement("tr");
            const rowId = `tr${i}`;

            row.id = rowId;

            ([...Object.values(Columns)]).forEach((column, i) => {
                const cell = document.createElement("td")
                cell.id = `${rowId}-td${i}`;
                cell.textContent = player[column];

                if (column === Columns.id) {
                    cell.className = "id";
                }

                if (column === Columns.Birthday) {
                    cell.textContent = new Date(player[column]).toLocaleDateString();
                    cell.value = player[column];
                }

                if (column === Columns.Edit) {
                    const editImg = document.createElement("img");
                    editImg.src = "/img/edit.png";
                    editImg.alt = "Edit";

                    cell.textContent = "";
                    cell.className = "edit";
                    removeChildren(cell);
                    cell.appendChild(editImg);
                    cell.onclick = async (v) => {
                        const rowId = (v.target.parentElement.id).split("-")[0];

                        if (editRow !== null && editRow !== cell.id.split("-")[0]) {
                            return;
                        }

                        editRow = rowId;

                        if (editMode) {
                            editMode = false;
                            editRow = null;

                            const rowElements = document.querySelectorAll(`[id^=${rowId}`);

                            const id = rowElements[1].textContent;
                            const name = rowElements[2].children[0].value;
                            const title = rowElements[3].children[0].value;
                            const race = rowElements[4].children[0].value;
                            const profession = rowElements[5].children[0].value;
                            const level = rowElements[6].textContent;
                            const birthday = rowElements[7].value;
                            const banned = rowElements[8].children[0].value;

                            await savePlayer({id, name, title, race, profession, birthday, banned, level})
                            await renderPages();
                            await fetchPlayers();
                            await renderPlayers();

                            return;
                        }

                        editMode = true;

                        removeChildren(cell);

                        const saveImg = document.createElement("img");
                        saveImg.src = "/img/save.png";
                        saveImg.alt = "Save";

                        cell.appendChild(saveImg);
                        cell.className = "save"

                        const rowElements = document.querySelectorAll(`[id^=${rowId}`);

                        rowElements.forEach((e, i) => {
                            const columnName = ColumnIndex[i];

                            if (!columnName || columnName === Columns.Birthday || columnName === Columns.Level) return;

                            const config = fieldConfig[columnName];
                            const cellId = `td${i}`;
                            const currentCellElement = document.getElementById(`${rowId}-${cellId}`)
                            const rowNode = document.getElementById(`${rowId}`)
                            const td = document.createElement("td");

                            td.id = `${rowId}-${cellId}`;

                            const field = useFields({
                                ...config,
                                defaultValue: currentCellElement.textContent
                            })

                            td.appendChild(field);
                            currentCellElement.insertAdjacentElement("beforebegin", td);
                            rowNode.removeChild(currentCellElement);
                        })

                    }
                }

                if (column === Columns.Delete) {
                    const deleteImg = document.createElement("img");
                    deleteImg.src = "/img/delete.png";
                    deleteImg.alt = "Edit";

                    cell.textContent = "";
                    cell.className = "delete";
                    cell.appendChild(deleteImg);
                    cell.onclick = async (v) => {
                        if (editMode) {
                            return;
                        }

                        const rowId = (v.target.parentElement.id).split("-")[0];
                        const row = document.getElementById(rowId);
                        const rowElements = document.querySelectorAll(`[id^=${rowId}`);
                        const id = rowElements[1].textContent;

                        await deletePlayer(id);
                        table.removeChild(row);

                        if (table.children.length === 1) {
                            await fetchPages();
                            await fetchPlayers();
                            await renderPlayers();
                            await renderPages();
                        }
                    }
                }

                row.append(cell);
            })

            table.appendChild(row);
        }
    )
}

savePlayer = async (player) => {
    return await fetch(`rest/players/${player.id}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(player),
    });
}

deletePlayer = async (id) => {
    return await fetch(`rest/players/${id}`, {method: "DELETE"});
}

initPlayers = async () => {
    await fetchPlayers();
    await renderPlayers();
}

initCreationForm = async () => {
    const creationForm = document.getElementById("player-creation-form");

    for (const column of Object.keys(Columns)) {
        const fieldContainer = document.createElement("div");
        const config = fieldConfig[Columns[column]];

        if (config) {
            const inputField = useFields({
                ...config,
                id: `create-${config.id}`
            })
            const label = document.createElement("div")
            label.textContent = column;
            fieldContainer.className = "field";

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(inputField);
            creationForm.appendChild(fieldContainer);
        }
    }

    const saveElement = document.getElementById("create-player");
    saveElement.onclick = async () => {
        await createPlayer();
        await removeChildren(creationForm);
        await initCreationForm();
    }
}

fetchPages = async () => {
    const response = await fetch("rest/players/count");

    totalPages = await response.json();
}

fetchPlayers = async () => {
    const url = new URL('http://localhost:8080/rest/players');
    const params = {pageNumber: currentPage, pageSize: currentPageSize};

    url.search = new URLSearchParams(params).toString();

    const response = await fetch(url);

    currentPlayers = await response.json();
}

createPlayer = async () => {
    const name = document.getElementById(`create-${fieldConfig[Columns.Name].id}`).value;
    const title = document.getElementById(`create-${fieldConfig[Columns.Title].id}`).value;
    const race = document.getElementById(`create-${fieldConfig[Columns.Race].id}`).value;
    const profession = document.getElementById(`create-${fieldConfig[Columns.Profession].id}`).value;
    const level = document.getElementById(`create-${fieldConfig[Columns.Level].id}`).value;
    const birthday = document.getElementById(`create-${fieldConfig[Columns.Birthday].id}`).value;
    const banned = document.getElementById(`create-${fieldConfig[Columns.Banned].id}`).value;

    const [year, month, day] = birthday.split("-");

    return fetch(`rest/players`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            title,
            race,
            profession,
            level,
            birthday: new Date(year, month, day).getTime(),
            banned
        }),
    }).then((res) => {
        if (!res.ok) {
            alert("Error data");
        }

        return res;
    });
}

const useSelect = ({id, options, defaultValue}) => {
    const select = document.createElement("select");
    select.id = id;

    for (const x of options) {
        const option = document.createElement("option")
        option.value = x;
        option.textContent = x;
        select.appendChild(option)
    }

    if (defaultValue) {
        select.value = defaultValue;
    }

    return select;
}

const useInput = ({id, options, defaultValue, dataType, min, max, maxLength, minLength}) => {
    const input = document.createElement("input");
    input.value = defaultValue || "";
    input.id = id;
    input.type = dataType;
    input.min = min;
    input.max = max;
    input.maxLength = maxLength;
    input.minLength = minLength;

    return input
}

const useFields = (config) => {
    switch (config.type) {
        case 'input':
            return useInput({...config});
        case 'select':
            return useSelect({...config});
    }
};

document.addEventListener('DOMContentLoaded', async function () {
    initCountPerPageSelect();
    await initPlayers();
    await initPages();
    await initCreationForm();
});