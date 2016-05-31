var tplListItem = doT.template('\
{{ for(var id in it.data) { }}\
{{ var dat = it.data[id]; }}\
<li class="list-group-item" data-id="{{=id}}">\
	<div class="clearfix">\
		<span class="list-item-img pull-left">\
			{{? dat.img}}\
			<img class="thumbnail" src="{{=dat.img}}" height="64">\
			{{?}}\
		</span>\
		<span class="list-item-title pull-left">{{=dat.title}}</span>\
		<span class="pull-right">\
			<a class="btn btn-xs btn-{{? it.included}}danger rem{{??}}success add{{?}}-playlist">\
				<span class="glyphicon glyphicon-{{? it.included}}minus{{??}}plus{{?}}"></span>\
			</a>\
			<a class="btn btn-xs" href="https://www.youtube.com/watch?v={{=id}}" target="_blank">\
				<span class="glyphicon glyphicon-play-circle"></span>\
			</a>\
			{{? !it.included}}\
			<a class="btn btn-xs btn-warning edit-video">\
				<span class="glyphicon glyphicon-edit"></span>\
			</a>\
			<a class="btn btn-xs btn-danger del-video">\
				<span class="glyphicon glyphicon-trash"></span>\
			</a>\
			{{?}}\
		</span>\
	</div>\
	{{? dat.tags}}\
	{{~dat.tags.split(" ") :tag:tid}}\
	<span class="label label-warning video-tags">{{=tag}}</span>\
	{{~}}\
	{{?}}\
</li>\
{{ } }}');
var tplTag = doT.template('\
<a href="#" class="label label-success taglist-all">All</a>\
{{ for (var tag in it) { }}\
<a href="#" class="label label-success taglist-tag">{{=tag}}</a>\
{{ } }}');
