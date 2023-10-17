//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;

let offset = 0;
let previousScrollPosition = 0;
let rowHeight = 28 - 1;
let limit = getLimit();
let listMode = true;
Init_UI();

function getLimit() {
    // estimate the value of limit according to height of content
    return Math.round($("#content").innerHeight() / rowHeight);
}
function Init_UI() {
    renderWords(true);
    $('#createWord').on("click", async function () {
        saveContentScrollPosition();
        renderCreateWordForm();
    });
    $('#abort').on("click", async function () {
        listMode = true;
        eraseContent();
        renderWords(true);
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    //// Handling window resize
    var resizeTimer = false;
    $(window).on('resize', function (e) {
        if (!resizeTimer) {
            $(window).trigger('resizestart');
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizeTimer = false;
            $(window).trigger('resizeend');
        }, 250);
    }).on('resizestart', function () {
        resizeTimer = true;
        console.log('Started resizing the window');
    }).on('resizeend', function () {
        console.log('Done resizing the window');
        limit = getLimit();
        if (listMode) renderWords(true);
    });
}

function renderAbout() {
    listMode = false;
    saveContentScrollPosition();
    eraseContent();
    $("#createWord").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#wordsList").append(
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
    let queryString =
        refresh
            ? "?fields=Val,Def&limit=" + wordsCount + "&offset=" + 0
            : "?fields=Val,Def&limit=" + limit + "&offset=" + offset;

    $("#actionTitle").text("Liste des mots");
    $("#createWord").show();
    $("#abort").hide();
    let words = await API_GetWords(queryString);
    if (refresh) eraseContent();
    if (words !== null) {
        $("#content").off();
        words.forEach(word => {
            $("#wordsList").append(renderWord(word));
        });

    } else {
        renderError("Service introuvable");
    }
    if (refresh)
        restoreContentScrollPosition();

    $("#content").on("scroll", function () {
        if (listMode) {
            if ($("#content").scrollTop() + $("#content").innerHeight() > ($("#wordsList").height() - rowHeight)) {
                $("#content").off();
                offset++;
                console.log(offset);
                renderWords();
                $("#content").scrollTop($("#content").scrollTop() + $("#content").innerHeight());
            }
        }
    });

}
function showWaitingGif() {
    eraseContent();
    $("#wordsList").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#wordsList").empty();
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
    $("#wordsList").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreateWordForm() {
    listMode = false;
    renderWordForm();
}
async function renderEditWordForm(id) {
    showWaitingGif();
    let word = await API_GetWord(id);
    if (word !== null)
        renderWordForm(word);
    else
        renderError("Word introuvable!");
}
async function renderDeleteWordForm(id) {
    showWaitingGif();
    $("#createWord").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let word = await API_GetWord(id);
    eraseContent();
    if (word !== null) {
        $("#content").append(`
        <div class="worddeleteForm">
            <h4>Effacer le word suivant?</h4>
            <br>
            <div class="wordRow" word_id=${word.Id}">
                <div class="wordContainer">
                    <div class="wordLayout">
                        <div class="wordName">${word.Name}</div>
                        <div class="wordPhone">${word.Phone}</div>
                        <div class="wordEmail">${word.Email}</div>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteWord" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deleteWord').on("click", async function () {
            showWaitingGif();
            let result = await API_DeleteWord(word.Id);
            if (result)
                renderWords();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderWords();
        });
    } else {
        renderError("Word introuvable!");
    }
}
function newWord() {
    word = {};
    word.Id = 0;
    word.Name = "";
    word.Phone = "";
    word.Email = "";
    return word;
}
function renderWordForm(word = null) {
    $("#createWord").hide();
    $("#abort").show();
    eraseContent();
    let create = word == null;
    if (create) {
        word = newWord();
        word.Avatar = "images/no-avatar.png";
    }
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="wordForm">
            <input type="hidden" name="Id" value="${word.Id}"/>

            <label for="Name" class="form-label">Nom </label>
            <input 
                class="form-control Alpha"
                name="Name" 
                id="Name" 
                placeholder="Nom"
                required
                RequireMessage="Veuillez entrer un nom"
                InvalidMessage="Le nom comporte un caractère illégal" 
                value="${word.Name}"
            />
            <label for="Phone" class="form-label">Téléphone </label>
            <input
                class="form-control Phone"
                name="Phone"
                id="Phone"
                placeholder="(000) 000-0000"
                required
                RequireMessage="Veuillez entrer votre téléphone" 
                InvalidMessage="Veuillez entrer un téléphone valide"
                value="${word.Phone}" 
            />
            <label for="Email" class="form-label">Courriel </label>
            <input 
                class="form-control Email"
                name="Email"
                id="Email"
                placeholder="Courriel"
                required
                RequireMessage="Veuillez entrer votre courriel" 
                InvalidMessage="Veuillez entrer un courriel valide"
                value="${word.Email}"
            />
            <!-- nécessite le fichier javascript 'imageControl.js' -->
            <label class="form-label">Avatar </label>
            <div   class='imageUploader' 
                   newImage='${create}' 
                   controlId='Avatar' 
                   imageSrc='${word.Avatar}' 
                   waitingImage="Loading_icon.gif">
            </div>
            <hr>
            <input type="submit" value="Enregistrer" id="saveWord" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();
    initFormValidation(); // important do to after all html injection!
    $('#wordForm').on("submit", async function (event) {
        event.preventDefault();
        let word = getFormData($("#wordForm"));
        word.Id = parseInt(word.Id);
        showWaitingGif();
        let result = await API_SaveWord(word, create);
        if (result)
            renderWords();
        else
            renderError("Une erreur est survenue! " + API_getcurrentHttpError());
    });
    $('#cancel').on("click", function () {
        renderWords();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
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