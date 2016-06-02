var tplListItem = doT.template('\
{{ for(var id in it) { }}\
{{ var dat = it[id]; }}\
{{ var tags = dat.tags.split(" "); }}\
{{? hasSelectedTag(tags) }}\
<tr{{? playlist[id] }} class="success"{{?}} data-id="{{=id}}">\
	<td>\
		{{? dat.img}}\
		<a href="https://www.youtube.com/watch?v={{=id}}" target="_blank">\
			<img class="thumbnail" src="{{=dat.img}}" height="64">\
		</a>\
		{{??}}\
		<a class="btn btn-xs" href="https://www.youtube.com/watch?v={{=id}}" target="_blank">\
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
		<a class="btn btn-xs btn-{{? playlist[id] }}danger rem{{??}}success add{{?}}-playlist">\
			<span class="glyphicon glyphicon-{{? playlist[id] }}minus{{??}}plus{{?}}"></span>\
		</a>\
		<a class="btn btn-xs btn-warning edit-video">\
			<span class="glyphicon glyphicon-edit"></span>\
		</a>\
		<a class="btn btn-xs btn-danger del-video">\
			<span class="glyphicon glyphicon-trash"></span>\
		</a>\
	</td>\
</tr>\
{{?}}\
{{ } }}');
var tplTag = doT.template('\
<a href="#" class="label label-{{? selectedTag }}warning{{??}}success{{?}} taglist-all">All</a>\
{{ for (var tag in it) { }}\
<a href="#" class="label label-{{? tag == selectedTag }}success{{??}}warning{{?}} taglist-tag">{{=tag}}</a>\
{{ } }}');
