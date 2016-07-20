var playlist = [];
var videolist = {};
var taglist = {};
var selectedTag;
var searchtext;
var re_link = {
    "YT": [/^https?:\/\/(?:\w+\.)?youtube\.com\/watch\?v=([_-\w]+)$/, YoutubePlayer],
    "DM": [/^https?:\/\/(?:\w+\.)?dailymotion\.com\/video\/(\w+)(?:_.+?)?$/, DailyMotionPlayer],
    "VM": [/^https?:\/\/(?:\w+\.)?vimeo\.com\/(\d+)$/, VimeoPlayer],
};

var playerNum;
var currentPlayer;
var playerPaused = true;

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
$(".playlist-text-2").click(function() {
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
    selectedTag = $(this).contents().get(0).nodeValue.trim();
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

$(".videolist").on("click", ".edit-tags", function() {
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
$(".videolist").on("click", ".replace-video", function() {
    var id = $(this).closest("tr").data("id");
    if (!videolist[id])
        return;

    var link = prompt("Please enter the new link:");
    if (link == null) {
        return false;
    }

    addVideo(link, videolist[id].tags, function() {
        delete videolist[id];

        saveVideoList();
        updateView();
    });
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
$(".videolist").on("click", ".player-play-this", function() {
    var id = $(this).closest("tr").data("id");
    if (!videolist[id])
        return;

    idx = playlist.indexOf(id);
    if (idx == -1) {
        return false;
    }

    playerPaused = false;
    playerNum = idx;
    initPlayer(idx);
});

$("#addvidform").on("submit", function() {
    var link = $($(this).data("link")).val();
    var tags = $($(this).data("tags")).val();

    addVideo(link, tags, function(vid) {
        saveVideoList();
        updateView();
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

    if (!confirm("Are you sure?")) {
        return false;
    }

    var replaceall = $($(this).data("checkbox")).is(':checked');
    if (replaceall) {
        videolist = newVidList;

        oldVersionCheck();
        saveVideoList();
        updateView();

        alert("Replaced video list successfully!");

        return false;
    }

    for (var id in newVidList) {
        videolist[id] = newVidList[id];
    }

    oldVersionCheck();
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

function addVideo(link, tags, callback) {
    if (!link) {
        alert("Empty link!");
        return;
    }

    var linfo = parseLink(link);
    if (!linfo) {
        alert("Bad link!");
        return;
    }

    var key = linfo.type + "|" + linfo.id;
    if (videolist[key]) {
        alert("Already exist!");
        return;
    }

    getEmbedInfo(link, function(vid) {
        videolist[key] = {
            id: linfo.id,
            type: linfo.type,
            title: vid.title,
            img: vid.thumbnail_url,
            tags: fixSpaces(tags),
        };

        if (callback) {
            callback(vid);
        }

        alert("Added '" + vid.title + "' successfully!");
    }, function(err) {
        alert("Error: " + err);
    });
}

function getEmbedInfo(link, cb_success, cb_error) {
    return $.getJSON('https://noembed.com/embed', {
        format: 'json',
        url: link,
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
    var link;
    var ytplaylist = [];

    if (playlist.length > 0) {
        for (var i = 0; i < playlist.length; i++) {
            if (playlist[i].substr(0, 3) == "YT|") {
                ytplaylist.push(playlist[i].substr(3));
            }
        }

        $("#player").show();
    } else {
        $("#player").hide();
    }

    link = "https://www.youtube.com/embed/?playlist=" + ytplaylist.join(",");
    $(".playlist-text").val(link);
    $(".playlist-link").attr("href", link);
    $(".playlist-embed").attr("src", link);

    link = "https://www.youtube.com/watch_videos?video_ids=" + ytplaylist.slice(0, 20).join(",");
    $(".playlist-text-2").val(link);
    $(".playlist-link-2").attr("href", link);

    playerPaused = true;
    playerNum = 0;
    initPlayer(0);
}

function updateExportData() {
    $("#textarea_exportdata").val(JSON.stringify(videolist));
}

function loadVideoList() {
    var localPlaylist = localStorage.getItem("videolist");
    if (!localPlaylist)
        return;

    videolist = JSON.parse(localPlaylist);
    oldVersionCheck();
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

    for (var i = 0, stext, negative; i < searchtext.length; i++) {
        stext = searchtext[i].trim().toLowerCase();
        negative = stext[0] == "!";

        if (negative) {
            stext = stext.substr(1);
        }

        if (stext == "") {
            continue;
        }

        if (negative) {
            if (stext == id || title.indexOf(stext) != -1 || tags.indexOf(stext) != -1) {
                return false;
            }
        } else {
            if (stext != id && title.indexOf(stext) == -1 && tags.indexOf(stext) == -1) {
                return false;
            }
        }
    }

    return true;
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

function parseLink(link) {
    for (var type in re_link) {
        matched = link.match(re_link[type][0]);

        if (matched) {
            return {
                "type": type,
                "id": matched[1],
            };
        }
    }
}

function oldVersionCheck() {
    for (var key in videolist) {
        if (key.indexOf("|") == -1) {
            videolist[key].id = key;
            videolist[key].type = "YT";
            videolist["YT|" + key] = videolist[key];
            delete videolist[key];
            console.log("Converted '" + key + "' to Youtube");
        }
    }
}

// All Player

$(".player-play").click(function() {
    if (!currentPlayer) {
        return;
    }

    playerPaused = false;
    currentPlayer.play();
});

$(".player-pause").click(function() {
    if (!currentPlayer) {
        return;
    }

    playerPaused = true;
    currentPlayer.pause();
});

$(".player-next").click(function() {
    playerNext();
});

$(".player-previous").click(function() {
    playerPrevious();
});

function playerNext() {
    if (playerNum == undefined) {
        playerNum = 0;
    } else if (!playlist.length) {
        return;
    } else if (playerNum == playlist.length - 1) {
        playerNum = 0;
    } else {
        playerNum++;
    }

    initPlayer(playerNum);
}

function playerPrevious() {
    if (playerNum == undefined) {
        playerNum = 0;
    } else if (!playlist.length) {
        return;
    } else if (playerNum == 0) {
        playerNum = playlist.length - 1;
    } else {
        playerNum--;
    }

    initPlayer(playerNum);
}

function initPlayer(num) {
    if (!playlist.length || !playlist[num]) {
        return;
    }

    var elm = document.createElement("div");
    var vid = videolist[playlist[num]];

    if (!vid) {
        console.log(playlist[num] + " not found!");
        return;
    }

    $("#player").html("");
    $("#player").append(elm);

    currentPlayer = createPlayer(vid.type, vid.id, elm);
}

function createPlayer(type, id, playerElm) {
    if (!re_link[type]) {
        return;
    }

    return re_link[type][1](id, playerElm, function() {
        if (!playerPaused) {
            currentPlayer.play();
        }
    }, function() {
        playerNext();
    });
}

function YoutubePlayer(id, elm, onReady, onEnd) {
    var player = new YT.Player(elm, {
        videoId: id,
        events: {
            'onReady': onReady,
            'onStateChange': function(event) {
                if (event.data == YT.PlayerState.ENDED) {
                    onEnd();
                }
            }
        }
    });

    return {
        play: function() {
            player.playVideo();
        },
        pause: function() {
            player.pauseVideo();
        }
    };
}

function DailyMotionPlayer(id, elm, onReady, onEnd) {
    var player = DM.player(elm, {
        video: id,
    });

    player.addEventListener('apiready', onReady);
    player.addEventListener('video_end', onEnd);

    return {
        play: function() {
            player.play();
        },
        pause: function() {
            player.pause();
        }
    };
}

function VimeoPlayer(id, elm, onReady, onEnd) {
    var player = new Vimeo.Player(elm, {
        id: id,
    });

    player.ready().then(onReady);
    player.on('ended', onEnd);

    return {
        play: function() {
            player.play();
        },
        pause: function() {
            player.pause();
        }
    };
}