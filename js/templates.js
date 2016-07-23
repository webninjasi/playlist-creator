var tplListItem = doT.template('\
{{~ it.order :id:_}}\
{{ var dat = it.list[id]; }}\
{{ var tags = dat.tags.split(" "); }}\
{{ var inList = inPlaylist(id); }}\
{{? hasSelectedTag(tags) && matchedInSearch(id, dat.title, tags) }}\
<tr class="{{? currentlyPlaying == id}}warning{{??}}{{? inList }}success{{?}}{{?}}" data-id="{{=id}}">\
	<td>\
		<a class="btn btn-xs btn-{{? inList }}danger rem{{??}}success add{{?}}-playlist">\
			<span class="glyphicon glyphicon-{{? inList }}minus{{??}}plus{{?}}"></span>\
		</a>\
		{{? inPlaylist(id) }}\
		<a class="btn btn-xs btn-success playlist-up">\
			<span class="glyphicon glyphicon-arrow-up"></span>\
		</a>\
		<a class="btn btn-xs btn-success playlist-down">\
			<span class="glyphicon glyphicon-arrow-down"></span>\
		</a>\
		{{?}}\
	</td>\
	<td>\
		{{? dat.img}}\
		<a href="{{=getLink(dat.type, dat.id)}}" target="_blank">\
			<img class="thumbnail" src="{{=dat.img}}" height="64">\
		</a>\
		{{??}}\
		<a class="btn btn-xs" href="{{=getLink(dat.type, dat.id)}}" target="_blank">\
			<span class="glyphicon glyphicon-play-circle"></span>\
		</a>\
		{{?}}\
	</td>\
	<td>{{=dat.title}}</td>\
	<td>\
		{{? dat.tags}}\
		{{~tags :tag:tid}}\
		<span class="label label-warning video-tags">{{=tag}}</span>\
		{{~}}\
		{{?}}\
	</td>\
	<td>\
		<a class="btn btn-xs btn-success player-play-this">\
			<span class="glyphicon glyphicon-play"></span>\
		</a>\
		<a class="btn btn-xs btn-warning replace-video">\
			<span class="glyphicon glyphicon-fire"></span>\
		</a>\
		<a class="btn btn-xs btn-warning edit-tags">\
			<span class="glyphicon glyphicon-edit"></span>\
		</a>\
		<a class="btn btn-xs btn-danger del-video">\
			<span class="glyphicon glyphicon-trash"></span>\
		</a>\
	</td>\
</tr>\
{{?}}\
{{~}}');
var tplTag = doT.template('<b>Tags: </b>\
<a href="#" class="label label-{{? selectedTag }}warning{{??}}success{{?}} taglist-all">All</a>\
{{ for (var tag in it) { }}\
<a href="#" class="label label-{{? tag == selectedTag }}success{{??}}warning{{?}} taglist-tag">{{=tag}} <span class="badge">{{=it[tag]}}</span></a>\
{{ } }}');