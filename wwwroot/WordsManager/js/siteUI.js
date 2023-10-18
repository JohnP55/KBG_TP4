//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;

let offset = 0;
let previousScrollPosition = 0;
let rowHeight = 28 - 1;
let limit = getLimit();
let listMode = true;
let search = "";

Init_UI();

function getLimit() {
    // estimate the value of limit according to height of content
    return Math.round($("#content").innerHeight() / rowHeight);
}
function Init_UI() {
    renderWords(true);

    $('#abort').on("click", async function () {
        listMode = true;
        renderWords(true);
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    $("#searchKey").on("change", () => {
        search = $("#searchKey").val();
        renderWords(true);
    })
    //// Handling window resize
    var resizeTimer = null;
    var resizeEndTriggerDelai = 250;
    $(window).on('resize', function (e) {
        if (!resizeTimer) {
            $(window).trigger('resizestart');
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizeTimer = null;
            $(window).trigger('resizeend');
        }, resizeEndTriggerDelai);
    }).on('resizestart', function () {
        console.log('resize start');
    }).on('resizeend', function () {
        console.log('resize end');
        if ($('#wordsList') != null) {
            limit = getLimit()
            renderWords(true);
        }
    });
}

function renderAbout() {
    listMode = false;
    eraseContent();
    $("#createWord").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de words</h2>
                <hr>
                <p>
                    Petite application de gestion de words à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Nicolas Chourot
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
async function renderWords(refresh = false) {
    let wordsCount = limit * (offset + 1);
    let queryString = refresh ? "?fields=Val,Def&limit=" + wordsCount + "&offset=" + 0 : "?fields=Val,Def&limit=" + limit + "&offset=" + offset;
    if (search != "")
        queryString += "&Val=" + search + "*";
    $("#actionTitle").text("Liste des mots");
    $("#createWord").show();
    $("#abort").hide();

    let words = await API_GetWords(queryString);
    if (words !== null) {
        if (refresh) {
            saveContentScrollPosition();
            eraseContent();
            $("#content").append($("<div id='wordsList'>"));
        }
        $("#content").off();
        words.forEach(word => {
            $("#wordsList").append(renderWord(word));
        });
        $("#content").on("scroll", function () {
            if ($("#content").scrollTop() + $("#content").innerHeight() > ($("#wordsList").height() - rowHeight)) {
                $("#content").off();
                offset++;
                console.log(offset);
                renderWords();
                $("#content").scrollTop($("#content").scrollTop() + $("#content").innerHeight());
            }
        });
    } else {
        renderError("Service introuvable");
    }
    if (refresh)
        restoreContentScrollPosition();
}
function showWaitingGif() {
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    showWaitingGif();
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content").scrollTop();
    console.log("Save SP", $("#content").scrollTop());
}
function restoreContentScrollPosition() {
    $("#content").scrollTop(contentScrollPosition);
    console.log("Restore SP", $("#content").scrollTop());
}
function renderError(message) {
    eraseContent();
    listMode = false;
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}

function renderWord(word) {
    return $(`
     <div class="wordRow" word_id=${word.Id}">
        <div class="wordContainer noselect">
            <div class="wordLayout">
                 <div></div>
                 <div class="wordInfo">
                    <span class="word">${word.Val}</span>
                    <span class="wordDef">${word.Def}</span>
                   
                </div>
            </div>
           
        </div>
    </div>           
    `);
}