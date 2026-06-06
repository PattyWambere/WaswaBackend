# andasy.hcl app configuration file generated for crosschainx on Thursday, 26-Mar-26 09:26:34 SAST
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "crosschainx"

app {

  env = {
    # Server
    PORT = "3000"
    JWT_SECRET = "super_secret_key_v2_12345"
    JWT_EXPIRES_IN = "24h"

    # Database
    # Reusing the connection string provided by the user previously
    # Note: User should ensure IP is whitelisted in Atlas for this to work
    MONGO_URI = "mongodb+srv://pattywrld2003_db_user:vOoXqRPPGkq3veDP@crosschainx.nvhbzdg.mongodb.net/CrossChainX_V2?retryWrites=true&w=majority"

    # App Defaults (Optional)
    DEFAULT_ASSET = "USDT"
    DEFAULT_NETWORK = "TRC20"

    # JWT
    WALLET_MNEMONIC = "dizzy mix dust rent hidden club truck breeze swift hollow seven thrive"
    INFURA_URL = "https://mainnet.infura.io/v3/f6ff82fbc6da45b7b284aba07fa150cb"
    #PORT=5000

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = "dxcgwpf4t"
    CLOUDINARY_API_KEY = "696985256699889"
    CLOUDINARY_API_SECRET = "ylF_ME_PJ6wyHSqdN_KcSNt2g3g"

    # Email Configuration (SMTP)
    SMTP_HOST = "smtp.gmail.com"
    SMTP_PORT = "587"
    SMTP_USER = "patty.nobleman@gmail.com"
    SMTP_PASS = "gyicexrnihoqkhcq"
  }

  port = 3000

  primary_region = "fsn"

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "crosschainx"
  }

}
