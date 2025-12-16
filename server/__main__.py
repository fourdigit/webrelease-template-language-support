"""
WebRelease Template Language Server - Main Entry Point
"""

import sys
import logging
from lsp_server import server

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/webrelease-lsp.log'),
        logging.StreamHandler(sys.stderr),
    ]
)

logger = logging.getLogger(__name__)

if __name__ == '__main__':
    logger.info("Starting WebRelease Template Language Server")
    
    # Start server with stdio
    server.start_io()
