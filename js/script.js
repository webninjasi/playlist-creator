var playlist = {};
var videolist = {};
var taglist = {};
var selectedTag;

if (typeof(Storage) !== "undefined") {
    loadVideoList();
}

$(".form-clear").click(function() {
    $(this).closest('form').find("input[type=text], textarea").val("");
});

$(".add-all").click(function() {
    $(".videolist tr:visible").each(function() {
        var id = $(this).data("id");
        if (playlist[id] || !videolist[id])
            return;

        playlist[id] = videolist[id];
    });

    updateView();
});
$(".remove-all").click(function() {
    playlist = {};
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
    if (playlist[id] || !videolist[id])
        return;

    playlist[id] = videolist[id];
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

    videolist[id].tags = fixTags(tags);
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
    if (!playlist[id])
        return;

    delete playlist[id];
    updateView();
});

$("#addvidform").on("submit", function() {
    var $msg = $($(this).data("msg"));

    var link = $($(this).data("link")).val();
    if (!link) {
        $msg.text("Empty link!");
        return false;
    }

    var matches = link.match(/watch\?v=([-_\w]+)$/);
    if (!matches || matches.length < 2) {
        $msg.text("Bad link!");
        return false;
    }

    var id = matches[1];
    if (videolist[id]) {
        $msg.text("Already exist!");
        return false;
    }

    var tags = $($(this).data("tags")).val();

    getVideoInfo(id, function(vid) {
        videolist[id] = {
            title: vid.title,
            img: vid.thumbnail_url,
            tags: fixTags(tags),
        };

        saveVideoList();
        updateView();

        $msg.text("Added the video successfully!");
    });

    return false;
});
$(".create-link").click(createLink);

function getVideoInfo(id, callback) {
    return $.getJSON('https://noembed.com/embed', { format: 'json', url: "https://www.youtube.com/watch?v=" + encodeURIComponent(id) }, callback);
}

function createLink() {
    var link = "http://www.youtube.com/watch_videos?video_ids=" + Object.keys(playlist).join(",");

    $(".playlist-text").text(link);
    $(".playlist-link").text(link);
    $(".playlist-link").attr("href", link);
}

function loadVideoList() {
    var localPlaylist = localStorage.getItem("videolist");
    if (!localPlaylist)
        return;

    videolist = JSON.parse(localPlaylist);

    updateView();
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

    $(".videolist").html(tplListItem(videolist));
    $(".taglist").html(tplTag(taglist));
}

function parseTags(list) {
    taglist = {};

    for (var id in list) {
        var currtags = list[id].tags;
        if (!currtags)
            continue;

        currtags = currtags.split(" ");

        for (var i = 0; i < currtags.length; i++) {
            taglist[currtags[i]] = true;
        }
    }
}

function fixTags(tags) {
    if (!tags)
        return "";

    return tags.trim().replace(/\s+/, " ");
}

function hasSelectedTag(tags) {
    return !selectedTag || tags.indexOf(selectedTag) != -1
}
