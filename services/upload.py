from imagekitio import ImageKit
import requests
import os
# Configuration
imagekit = ImageKit(private_key=os.environ.get('IMAGEKIT_PRIVATE_KEY'),public_key=os.environ.get('IMAGEKIT_PUBLIC_KEY'),url_endpoint=os.environ.get('IMAGEKIT_URL_ENDPOINT'))
def upload_document(file_object, file_name):
     try:
        upload = imagekit.upload_file(
            file=file_object,
            file_name=file_name,
            options={
                "folder": "/user_profiles/",
                "is_private_file": False, # Make it public so the browser can see it
            }
        )
        return upload.url
     except Exception as e:
        print(f"Error uploading document: {e}")
        return None
           
