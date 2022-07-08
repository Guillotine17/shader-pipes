# python.exe writer.py webcam | node.exe shaderstuff.js fish_chrom.frag | python.exe show_pipe_image.py
# python.exe writer.py webcam | node.exe read_pipe_image.js videoIntensityScope.frag | python.exe show_pipe_image.py
python.exe writer.py webcam | node.exe read_pipe_image.js fish_chrom.frag | python.exe show_pipe_image.py
# python.exe writer.py webcam | python.exe show_pipe_image.py

# node.exe shaderPassTest fish_chrom.frag