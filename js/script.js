var playlist = [];
var videolist = {};
var taglist = {};
var selectedTag;
var searchtext;

if (typeof(Storage) !== "undefined") {
    loadVideoList();
    updateView();
}

$(".playlist-search")[0].oninput = updateSearchText;
$(".playlist-search")[0].onpropertychange = updateSearchText;

$(".form-clear").click(function() {
    $(this).closest('form').find("input[type=text], textarea").val("");
});
$(".playlist-text").click(function() {
    this.setSelectionRange(0, this.value.length);
});

$(".add-all").click(function() {
    $(".videolist tr:visible").each(function() {
        var id = $(this).data("id");
        if (inPlaylist(id) || !videolist[id])
            return;

        addPlaylist(id);
    });

    updateView();
});
$(".remove-all").click(function() {
    playlist = [];
    updateView();
});

$(".taglist").on("click", ".taglist-all", function() {
    selectedTag = undefined;
    updateView();
});
$(".taglist").on("click", ".taglist-tag", function() {
    selectedTag = $(this).text();
    updateView();
});

$(".videolist").on("click", ".add-playlist", function() {
    var id = $(this).closest("tr").data("id");
    if (inPlaylist(id) || !videolist[id])
        return;

    addPlaylist(id);
    updateView();
});
$(".videolist").on("click", ".playlist-up", function() {
    var id = $(this).closest("tr").data("id");
    if (!inPlaylist(id) || !videolist[id])
        return;

    swapPlaylist(id, -1);
    updateView();
});
$(".videolist").on("click", ".playlist-down", function() {
    var id = $(this).closest("tr").data("id");
    if (!inPlaylist(id) || !videolist[id])
        return;

    swapPlaylist(id, 1);
    updateView();
});

$(".videolist").on("click", ".edit-video", function() {
    var id = $(this).closest("tr").data("id");
    if (!videolist[id])
        return;

    var tags = prompt("Please enter the new tags:", videolist[id].tags);
    if (tags == null || videolist[id].tags == tags) {
        return false;
    }

    videolist[id].tags = fixSpaces(tags);
    saveVideoList();
    updateView();
});
$(".videolist").on("click", ".del-video", function() {
    if (!confirm("Are you sure?")) {
        return;
    }

    var id = $(this).closest("tr").data("id");
    if (!videolist[id])
        return;

    delete videolist[id];
    saveVideoList();
    updateView();
});
$(".videolist").on("click", ".rem-playlist", function() {
    var id = $(this).closest("tr").data("id");
    if (!inPlaylist(id)) return;

    removePlaylist(id);
    updateView();
});

$("#addvidform").on("submit", function() {
    var link = $($(this).data("link")).val();
    if (!link) {
        alert("Empty link!");
        return false;
    }

    var matches = link.match(/watch\?v=([-_\w]+)$/);
    if (!matches || matches.length < 2) {
        alert("Bad link!");
        return false;
    }

    var id = matches[1];
    if (videolist[id]) {
        alert("Already exist!");
        return false;
    }

    var tags = $($(this).data("tags")).val();

    getVideoInfo(id, function(vid) {
        videolist[id] = {
            title: vid.title,
            img: vid.thumbnail_url,
            tags: fixSpaces(tags),
        };

        saveVideoList();
        updateView();

        alert("Added '" + vid.title + "' successfully!");
    }, function(err) {
        alert("Error: " + err);
    });

    return false;
});

$("#form_importvid").on("submit", function() {
    var content = $($(this).data("content")).val();
    if (!content) {
        alert("Empty JSON data!");
        return false;
    }

    var newVidList;

    try {
        newVidList = JSON.parse(content);
        if (!newVidList) {
            alert("Invalid JSON data!");
            return false;
        }
    } catch (err) {
        return false;
    }

    var replaceall = $($(this).data("checkbox")).is(':checked');
    if (replaceall) {
        videolist = newVidList;

        saveVideoList();
        updateView();

        alert("Replaced video list successfully!");

        return false;
    }

    for (var id in newVidList) {
        videolist[id] = newVidList[id];
    }

    saveVideoList();
    updateView();

    alert("Imported video list successfully!");

    return false;
});
$(".download-data").click(function() {
    var isFileSaverSupported = !!new Blob;
    if (!isFileSaverSupported) {
        alert("File saver isn't supported on your browser!");
        return false;
    }

    var blob = new Blob([JSON.stringify(videolist)], {
        type: "application/json;charset=utf-8"
    });
    saveAs(blob, "playlist-data.json");
});
$("#file_jsondata").change(function() {
    var file = $(this).get(0).files[0];
    if (!file) {
        return false;
    }

    var $content = $($(this).closest("form").data("content"));

    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");

    reader.onload = function(evt) {
        $content.val(evt.target.result);
    }

    reader.onerror = function(evt) {
        alert("An error occured while loading video list from '" + file.name + "'!");
    }

    return false;
});

function getVideoInfo(id, cb_success, cb_error) {
    return $.getJSON('https://noembed.com/embed', {
        format: 'json',
        url: "https://www.youtube.com/watch?v=" + encodeURIComponent(id)
    }, function(data) {
        if (data["error"]) {
            cb_error(data["error"]);
            return;
        }

        cb_success(data);
    });
}

function updateSearchText() {
    searchtext = fixSpaces($(this).val()).split(' ');
    updateView();
}

function updateLink() {
    var link = "http://www.youtube.com/watch_videos?video_ids=" + playlist.join(",");

    $(".playlist-text").val(link);
    $(".playlist-link").attr("href", link);
}

function updateExportData() {
    $("#textarea_exportdata").val(JSON.stringify(videolist));
}

function loadVideoList() {
    var localPlaylist = localStorage.getItem("videolist");
    if (!localPlaylist)
        return;

    videolist = JSON.parse(localPlaylist);
}

function saveVideoList() {
    var videolist_str = JSON.stringify(videolist);

    try {
        localStorage.setItem("videolist", videolist_str);
    } catch (err) {

    }
}

function updateView() {
    parseTags(videolist);

    if (!taglist[selectedTag])
        selectedTag = undefined;

    $(".videolist").html(tplListItem({
        list: videolist,
        order: getOrderedList()
    }));
    $(".taglist").html(tplTag(taglist));

    updateLink();
    updateExportData();
}

function getOrderedList() {
    var keys = Object.keys(videolist);

    keys.sort(function(a, b) {
        return indexOrLen(playlist, a) - indexOrLen(playlist, b);
    });

    return keys;
}

function indexOrLen(arr, elm) {
    return (arr.indexOf(elm) + 1 || arr.length + 1) - 1;
}

function parseTags(list) {
    taglist = {};

    for (var id in list) {
        var currtags = list[id].tags;
        if (!currtags)
            continue;

        currtags = currtags.split(" ");

        for (var i = 0; i < currtags.length; i++) {
            taglist[currtags[i]] = taglist[currtags[i]] ? taglist[currtags[i]] + 1 : 1;
        }
    }
}

function fixSpaces(text) {
    if (!text)
        return "";

    return text.trim().replace(/\s+/, " ");
}

function matchedInSearch(id, title, tags) {
    if (!searchtext)
        return true;

    id = id.toLowerCase();
    title = title.toLowerCase();

    for (var i = 0; i < searchtext.length; i++) {
        var stext = searchtext[i].trim().toLowerCase();
        if (stext == id || title.indexOf(stext) != -1 || tags.indexOf(stext) != -1) {
            return true;
        }
    }

    return false;
}

function hasSelectedTag(tags) {
    return !selectedTag || tags.indexOf(selectedTag) != -1
}

function inPlaylist(id) {
    return playlist && playlist.indexOf(id) != -1;
}

function addPlaylist(id) {
    if (inPlaylist(id))
        return;

    playlist.push(id);
}

function removePlaylist(id) {
    var idx = playlist.indexOf(id);
    if (idx == -1)
        return;

    playlist.splice(idx, 1);
}

function swapPlaylist(id, off) {
    var idx = playlist.indexOf(id);
    if (idx == -1)
        return;

    var temp = playlist[idx + off];
    if (!temp)
        return;

    playlist[idx + off] = playlist[idx];
    playlist[idx] = temp;
}