#!/bin/bash
# Build all pentesting lab Docker images (Linux/Mac version)

echo "🔨 Building All Pentesting Lab Docker Images..."
echo ""

labs=(
    "sql-injection:pentest/sql-injection:latest"
    "xss:pentest/xss:latest"
    "broken-auth:pentest/broken-auth:latest"
    "ssrf:pentest/ssrf:latest"
    "broken-access:pentest/broken-access:latest"
    "crypto:pentest/crypto:latest"
    "misconfig:pentest/misconfig:latest"
    "network:pentest/network:latest"
    "design:pentest/design:latest"
    "bank:pentest/bank:latest"
)

successful=0
failed=0
failed_labs=()

for lab_entry in "${labs[@]}"; do
    IFS=':' read -r lab_name tag <<< "$lab_entry"
    
    echo "Building $lab_name..."
    
    lab_path="labs/$lab_name"
    
    if [ ! -d "$lab_path" ]; then
        echo "  ❌ Directory not found: $lab_path"
        ((failed++))
        failed_labs+=("$lab_name")
        continue
    fi
    
    cd "$lab_path" || continue
    
    if docker build -t "$tag" . > /dev/null 2>&1; then
        echo "  ✅ $lab_name built successfully"
        ((successful++))
    else
        echo "  ❌ Failed to build $lab_name"
        ((failed++))
        failed_labs+=("$lab_name")
    fi
    
    cd - > /dev/null || exit
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Build Summary:"
echo "  ✅ Successful: $successful"
echo "  ❌ Failed: $failed"

if [ $failed -gt 0 ]; then
    echo ""
    echo "Failed labs:"
    for lab in "${failed_labs[@]}"; do
        echo "  - $lab"
    done
fi

echo ""
echo "To list all images:"
echo "  docker images | grep pentest"
echo ""
echo "To test a lab:"
echo "  docker run -d -p 8080:80 pentest/sql-injection:latest"
echo "  Then open http://localhost:8080 in your browser"

if [ $successful -eq ${#labs[@]} ]; then
    echo ""
    echo "🎉 All labs built successfully!"
    exit 0
else
    echo ""
    echo "⚠️  Some labs failed to build. Check errors above."
    exit 1
fi
