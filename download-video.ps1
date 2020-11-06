New-Item "videos" -Type Directory  | Out-Null

$url = $args[0];
$filename = if ($args[1] -eq $null)  {'video'} else {$args[0]};

$files = (youtube-dl -g $url).split('`n');
$video = $files[0];
$audio = $files[1];

$fps = [int](ffprobe -v error -of 'default=noprint_wrappers=1:nokey=1' -select_streams 'v:0' -show_entries 'stream=r_frame_rate' $video).split('/')[0];
ffmpeg -v error -i $video -i $audio -t 60 -g ($fps * 2) -hls_time 2 -hls_list_size 0 -c:v h264_nvenc "videos/$filename.m3u8";
