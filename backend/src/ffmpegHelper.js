const ffmpeg = require('fluent-ffmpeg');

exports.processVideo = (input, output, start, duration, opts) => {
    return new Promise((resolve, reject) => {
        let command = ffmpeg(input)
            .setStartTime(start) // format: '00:00:05' atau detik
            .setDuration(duration);

        // Codec & Format
        if (opts.format === 'mp4') {
            command.format('mp4').videoCodec('libx264').audioCodec('aac');
        } else if (opts.format === 'webm') {
            command.format('webm').videoCodec('libvpx-vp9').audioCodec('libvorbis');
        }

        // Resolusi (Scale)
        if (opts.resolution && opts.resolution !== 'original') {
            command.size(opts.resolution); // contoh: '1280x720'
        }

        // Basic Filters (Crop/Rotate) - Opsional
        const filters = [];
        if (opts.rotate) filters.push(`transpose=${opts.rotate}`); // 1=90Clockwise
        if (filters.length > 0) command.videoFilters(filters);

        command
            .on('end', () => resolve(output))
            .on('error', (err) => reject(err))
            .save(output);
    });
};
