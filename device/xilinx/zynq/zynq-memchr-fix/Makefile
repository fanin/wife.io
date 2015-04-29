all:
	arm-xilinx-linux-gnueabi-gcc -O2 -shared -fPIC -o memchr.so memchr.c
	arm-xilinx-linux-gnueabi-strip memchr.so

clean:
	@rm -f memchr.so
