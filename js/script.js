var playlist = {};
var videolist = {};
var tag2vids = {};

if (typeof(Storage) !== "undefined") {
    loadVideoList();
}

$(".form-clear").click(function() {
    $(this).closest('form').find("input[type=text], textarea").val("");
});

$(".create-link").click(createLink);
$(".clear-list").click(clearPlaylist);

$(".add-all").click(function() {
    $(".list-group-item:visible").each(function() {
        var id = $(this).data("id");
        if (playlist[id] || !videolist[id])
            return;

        playlist[id] = videolist[id];
    });
    generatePlaylist();
});

$(".taglist").on("click", ".taglist-all", function() {
    var state = $(this).hasClass("label-success");
    state = !state;
    if (state) {
        $(".taglist .label").addClass("label-success").removeClass("label-warning");
        $(".list-group-item").show();
    } else {
        $(".taglist .label").addClass("label-warning").removeClass("label-success");
        $(".list-group-item").hide();
    }
});

$(".taglist").on("click", ".taglist-tag", function() {
    var state = $(this).hasClass("label-success");
    state = !state;
    if (state) {
        $(this).addClass("label-success").removeClass("label-warning");
    } else {
        $(this).addClass("label-warning").removeClass("label-success");
        $(".taglist .taglist-all").addClass("label-warning").removeClass("label-success");
    }

    var ids = [];

    $(".taglist .label-success").each(function() {
        ids = ids.concat(tag2vids[$(this).text()]);
    });
    $(".list-group-item").hide();
    $(".list-group-item").each(function() {
        var id = $(this).data("id");

        if (ids.indexOf(id) != -1)
            $(this).show();
    });
});

$(".videolist").on("click", ".add-playlist", function() {
    var id = $(this).closest(".list-group-item").data("id");
    if (playlist[id] || !videolist[id])
        return;

    playlist[id] = videolist[id];
    generatePlaylist();
});

$(".videolist").on("click", ".edit-video", function() {
    var id = $(this).closest(".list-group-item").data("id");
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

    var id = $(this).closest(".list-group-item").data("id");
    if (!videolist[id])
        return;

    delete videolist[id];
    saveVideoList();
    updateView();
});

$(".playlist").on("click", ".rem-playlist", function() {
    var id = $(this).closest(".list-group-item").data("id");
    if (!playlist[id])
        return;

    delete playlist[id];
    generatePlaylist();
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

function getVideoInfo(id, callback) {
    return $.getJSON('https://noembed.com/embed', { format: 'json', url: "https://www.youtube.com/watch?v=" + encodeURIComponent(id) }, callback);
}

function loadVideoList() {
    var localPlaylist = localStorage.getItem("videolist");
    if (!localPlaylist)
        return;

    videolist = JSON.parse(localPlaylist);
    updateView();
}

function updateView() {
    var tags = parseTags(videolist);

    $(".videolist").html(generateList(videolist));
    $(".taglist").html(tplTag(tags));
}

function saveVideoList() {
    var videolist_str = JSON.stringify(videolist);

    try {
        localStorage.setItem("videolist", videolist_str);
    } catch (err) {

    }
}

function clearPlaylist() {
    playlist = {}
    $(".playlist").html("");
}

function generateList(list, included) {
    return tplListItem({ included: included, data: list });
}

function parseTags(list) {
    tag2vids = {};

    for (var id in list) {
        var currtags = list[id].tags;
        if (!currtags)
            continue;

        currtags = currtags.split(" ");

        for (var i = 0; i < currtags.length; i++) {
            if (tag2vids[currtags[i]])
                tag2vids[currtags[i]].push(id);
            else
                tag2vids[currtags[i]] = [id];
        }
    }

    return tag2vids;
}

function generatePlaylist() {
    $(".playlist").html(generateList(playlist, true));
}

function createLink() {
    var link = "http://www.youtube.com/watch_videos?video_ids=" + Object.keys(playlist).join(",");

    $(".playlist-text").text(link);
    $(".playlist-link").text(link);
    $(".playlist-link").attr("href", link);
}

function fixTags(tags) {
    if (!tags)
        return "";

    return tags.trim().replace(/\s+/, " ");
}
