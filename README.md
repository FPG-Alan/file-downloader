# File Transfer

Implement a browsers-compatible file system as a basis for donwload(and upload, perhaps) large files on the front end.

On Chrome, adopt the Filesystem API, the maximum size depends on the client's hard drive size.

On other browsers, use blob saved in RAM, has a 2GB size limit under 64-bit addressing or 1GB size limit under 32-bit addressing.

If the file size exceeds the limit mentioned above, we recommend that users download the file using the desktop application(temporarily a command line program).
