"""Measure duration and levels only; never modify or play the source audio."""
import concurrent.futures
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r'C:\Users\rukat\manmarubuu-project\game\audio-library')


def measure(path):
    info = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                           '-of', 'json', str(path)], capture_output=True, text=True, check=True)
    duration = float(json.loads(info.stdout)['format']['duration'])
    result = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path),
                             '-vn', '-af', 'volumedetect,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json',
                             '-f', 'null', '-'], capture_output=True, text=True, check=True)
    loudness = json.loads(re.findall(r'\{[^{}]+"input_i"[^{}]+\}', result.stderr, re.S)[-1])
    def finite(value):
        return None if value in ('-inf', 'inf', 'nan') else float(value)
    return dict(path=path.relative_to(SOURCE).as_posix(), duration_seconds=round(duration, 3),
                integrated_lufs=finite(loudness['input_i']), true_peak_dbtp=finite(loudness['input_tp']),
                loudness_range_lu=finite(loudness['input_lra']),
                mean_volume_dbfs=float(re.search(r'mean_volume: ([\-\d.]+)', result.stderr)[1]),
                sample_peak_dbfs=float(re.search(r'max_volume: ([\-\d.]+)', result.stderr)[1]))


if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        rows = list(pool.map(measure, sorted(SOURCE.rglob('*.mp3'))))
    output = ROOT / 'docs' / 'audio-level-audit.json'
    output.write_text(json.dumps(dict(source=str(SOURCE), method='ffprobe duration; ffmpeg volumedetect and loudnorm input measurements; null output; no listening or source edits',
                                     short_clip_note='Short SFX integrated LUFS may be unavailable or unrepresentative; use peak and mean levels.', files=rows), ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(dict(report=str(output), count=len(rows), bgm=[r for r in rows if r['path'].startswith('BGM/')],
                          duration_range=[min(r['duration_seconds'] for r in rows), max(r['duration_seconds'] for r in rows)],
                          true_peak_above_zero=[r for r in rows if r['true_peak_dbtp'] is not None and r['true_peak_dbtp']>0]), ensure_ascii=False))
